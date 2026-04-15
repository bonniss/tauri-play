import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  Text,
} from '@mantine/core';
import {
  IconChevronRight,
  IconDots,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CameraUI from '~/components/camera/CameraUI';
import { CaptureSession } from '~/components/camera/types';
import ContentEditable from '~/components/headless/ContentEditable';
import ProjectActionButton from '~/components/project/ProjectActionButton';
import SampleGrid from '~/components/project/SampleGrid';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import UploadSamplesButton from '~/components/project/UploadSamplesButton';
import { createClass, deleteClass } from '~/lib/db/domain/classes';
import { activateProject, updateProject } from '~/lib/db/domain/projects';
import { createSample, deleteSample } from '~/lib/db/domain/samples';
import {
  deleteSampleFile,
  saveCapturedSampleFrames,
} from '~/lib/project/sample-storage';

export const Route = createFileRoute('/projects/$projectId/label/')({
  component: ProjectLabelPage,
});

type CameraTargetState = {
  classId: string;
  createdNow: boolean;
  slot: 'class' | 'top';
};

function ProjectLabelPage() {
  const {
    addSamplesToClass,
    classes,
    projectId,
    projectStatus,
    removeClass,
    removeSamplesFromClass,
    seedClass,
    setProjectStatus,
    updateClassName,
  } = useProjectOne();
  const hasClasses = classes.length > 0;
  const [openClassMap, setOpenClassMap] = useState<Record<string, boolean>>({});
  const [cameraTargetState, setCameraTargetState] = useState<CameraTargetState | null>(null);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isPersistingCameraFrames, setIsPersistingCameraFrames] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const visibleClasses = useMemo(
    () =>
      classes.filter((item) => {
        if (cameraTargetState?.slot !== 'top' || !cameraTargetState.createdNow) {
          return true;
        }

        return !(
          item.id === cameraTargetState.classId && item.samples.length === 0
        );
      }),
    [cameraTargetState, classes],
  );
  const queryClient = useQueryClient();
  const deleteSampleMutation = useMutation({
    mutationFn: async ({
      filePath,
      sampleId,
    }: {
      filePath: string;
      sampleId: string;
    }) => {
      await deleteSample(sampleId);

      try {
        await deleteSampleFile(filePath);
      } catch (error) {
        console.warn('Failed to delete sample file.', error);
        toast.warning('Deleted sample record, but failed to remove local file.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const currentCameraClass = cameraTargetState
    ? classes.find((item) => item.id === cameraTargetState.classId) ?? null
    : null;
  const pendingDeleteClass = deleteClassId
    ? classes.find((item) => item.id === deleteClassId) ?? null
    : null;
  const isTopCameraOpen =
    currentCameraClass != null && cameraTargetState?.slot === 'top';

  useEffect(() => {
    setOpenClassMap((current) => {
      const next: Record<string, boolean> = {};

      classes.forEach((item, index) => {
        next[item.id] = current[item.id] ?? index === 0;
      });

      return next;
    });
  }, [classes]);

  async function handleDeleteSample(sample: (typeof classes)[number]['samples'][number]) {
    removeSamplesFromClass(sample.classId, [sample.id]);

    try {
      await deleteSampleMutation.mutateAsync({
        filePath: sample.filePath,
        sampleId: sample.id,
      });
    } catch (error) {
      addSamplesToClass(sample.classId, [sample]);
      throw error;
    }
  }

  async function openInlineCamera(target: { classId?: string; slot: 'class' | 'top' }) {
    if (isOpeningCamera || isPersistingCameraFrames) {
      return;
    }

    const targetClassId = target.classId;
    const isSameTarget =
      cameraTargetState?.slot === target.slot &&
      cameraTargetState.classId === targetClassId;

    if (isSameTarget) {
      return;
    }

    if (cameraTargetState) {
      await closeInlineCamera();
    }

    setIsOpeningCamera(true);

    if (target.slot === 'class' && targetClassId) {
      setCameraTargetState({
        classId: targetClassId,
        createdNow: false,
        slot: 'class',
      });
      setOpenClassMap((current) => ({
        ...current,
        [targetClassId]: true,
      }));
      setIsOpeningCamera(false);
      return;
    }

    const seededClass = seedClass();
    setCameraTargetState({
      classId: seededClass.id,
      createdNow: true,
      slot: 'top',
    });

    try {
      await createClass({
        id: seededClass.id,
        projectId,
        name: seededClass.name,
        order: seededClass.order,
      });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      removeClass(seededClass.id);
      setCameraTargetState(null);
      toast.error('Failed to create camera class.');
    } finally {
      setIsOpeningCamera(false);
    }
  }

  async function closeInlineCamera() {
    if (!cameraTargetState || isOpeningCamera || isPersistingCameraFrames) {
      return;
    }

    const cameraClass = classes.find((item) => item.id === cameraTargetState.classId);
    const shouldDeleteEmptySeededClass =
      cameraTargetState.createdNow && cameraClass != null && cameraClass.samples.length === 0;

    if (shouldDeleteEmptySeededClass) {
      try {
        await deleteClass(cameraTargetState.classId);
        removeClass(cameraTargetState.classId);
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
        toast.error('Failed to clean up empty camera class.');
      }
    }

    setCameraTargetState(null);
  }

  async function handleDeleteClass() {
    if (!pendingDeleteClass || isPersistingCameraFrames || isOpeningCamera) {
      return;
    }

    try {
      await deleteClass(pendingDeleteClass.id);

      if (cameraTargetState?.classId === pendingDeleteClass.id) {
        setCameraTargetState(null);
      }

      removeClass(pendingDeleteClass.id);
      setDeleteClassId(null);
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Class deleted.');
    } catch (error) {
      toast.error('Failed to delete class.');
    }
  }

  async function persistCameraFrames(session: CaptureSession) {
    if (!cameraTargetState) {
      return;
    }

    setIsPersistingCameraFrames(true);

    try {
      const nextSamples = await saveCapturedSampleFrames({
        classId: cameraTargetState.classId,
        frames: session.frames,
        projectId,
      });
      const optimisticSamples = addSamplesToClass(cameraTargetState.classId, nextSamples);
      const insertedSampleIds: string[] = [];

      try {
        for (const sample of optimisticSamples) {
          await createSample({
            id: sample.id,
            projectId,
            classId: sample.classId,
            filePath: sample.filePath,
            mimeType: sample.mimeType,
            width: sample.width,
            height: sample.height,
            originalFileName: sample.originalFileName,
            originalFilePath: sample.originalFilePath,
            fileSize: sample.fileSize,
            lastModifiedAt: sample.lastModifiedAt,
            contentHash: sample.contentHash,
            extraMetadata: sample.extraMetadata,
            source: sample.source,
            order: sample.order,
          });
          insertedSampleIds.push(sample.id);
        }

        if (projectStatus === 'draft') {
          setProjectStatus('active');
          await activateProject(projectId);
        } else {
          await updateProject({ projectId });
        }

        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
        removeSamplesFromClass(
          cameraTargetState.classId,
          optimisticSamples.map((sample) => sample.id),
        );
        await Promise.allSettled(
          insertedSampleIds.map(async (sampleId) => {
            await deleteSample(sampleId);
          }),
        );
        await Promise.allSettled(
          optimisticSamples.map(async (sample) => {
            await deleteSampleFile(sample.filePath);
          }),
        );
        throw error;
      }
    } catch (error) {
      toast.error('Failed to save camera samples.');
    } finally {
      setIsPersistingCameraFrames(false);
    }
  }

  async function handleCameraCaptureSession(session: CaptureSession) {
    if (session.source === 'single') {
      await persistCameraFrames(session);
      return;
    }

    if (session.source === 'burst' || session.source === 'rec') {
      await persistCameraFrames(session);
    }
  }

  return (
    <Paper className="p-6" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Label</h2>
        <Group grow wrap="nowrap">
          <ProjectActionButton
            action="camera"
            className="flex-1"
            loading={isOpeningCamera}
            onClick={() => {
              if (isTopCameraOpen) {
                void closeInlineCamera();
                return;
              }

              void openInlineCamera({ slot: 'top' });
            }}
          >
            {isTopCameraOpen ? 'Close Camera' : 'Camera'}
          </ProjectActionButton>
          <UploadSamplesButton
            buttonLabel="Upload"
            className="flex-1"
          />
        </Group>
      </div>

      {isTopCameraOpen && currentCameraClass ? (
        <div className="mt-6 space-y-3">
          <CameraCapturePanel
            currentCameraClass={currentCameraClass}
            onCaptureSession={handleCameraCaptureSession}
            onRenameClass={updateClassName}
          />
        </div>
      ) : null}

      {hasClasses ? (
        <div className="mt-6 space-y-4">
          {visibleClasses.map((item) => (
            <div
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              key={item.id}
            >
              <div className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-2">
                    <ActionIcon
                      aria-label={openClassMap[item.id] ? 'Collapse class' : 'Expand class'}
                      onClick={() => {
                        setOpenClassMap((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }));
                      }}
                      size="sm"
                      variant="subtle"
                    >
                      <IconChevronRight
                        className={openClassMap[item.id] ? 'rotate-90 transition-transform' : 'transition-transform'}
                        size={16}
                        stroke={1.8}
                      />
                    </ActionIcon>
                  <ContentEditable
                    as="span"
                    aria-label={`Class name ${item.name}`}
                    className="inline-block w-fit max-w-full truncate rounded px-1 py-0.5"
                    focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                    onBlur={(value) => {
                      updateClassName(item.id, value);
                    }}
                    value={item.name}
                  />
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.samples.length}
                  </span>
                  </div>
                  <Group gap="xs">
                    <ProjectActionButton
                      action="camera"
                      onClick={() => {
                        if (
                          cameraTargetState?.slot === 'class' &&
                          cameraTargetState.classId === item.id
                        ) {
                          void closeInlineCamera();
                          return;
                        }

                        void openInlineCamera({ classId: item.id, slot: 'class' });
                      }}
                      size="xs"
                      variant={
                        cameraTargetState?.slot === 'class' &&
                        cameraTargetState.classId === item.id
                          ? 'filled'
                          : undefined
                      }
                    >
                      {cameraTargetState?.slot === 'class' &&
                      cameraTargetState.classId === item.id
                        ? 'Close'
                        : 'Camera'}
                    </ProjectActionButton>
                    <UploadSamplesButton
                      buttonLabel="Upload"
                      classId={item.id}
                      size="xs"
                    />
                    <Menu position="bottom-end" shadow="md" withinPortal>
                      <Menu.Target>
                        <ActionIcon aria-label="Class actions" size="sm" variant="subtle">
                          <IconDots size={16} stroke={1.8} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => {
                            setDeleteClassId(item.id);
                          }}
                        >
                          Delete
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconDownload size={14} />}
                          onClick={() => {
                            toast.message('Export will come next.');
                          }}
                        >
                          Export
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </div>
              </div>

              {openClassMap[item.id] ? (
                <Box className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                  {cameraTargetState?.slot === 'class' &&
                  currentCameraClass?.id === item.id ? (
                    <div className="mb-4">
                      <CameraCapturePanel
                        currentCameraClass={currentCameraClass}
                        onCaptureSession={handleCameraCaptureSession}
                        onRenameClass={updateClassName}
                      />
                    </div>
                  ) : null}
                  <SampleGrid
                    onDeleteSample={handleDeleteSample}
                    samples={item.samples}
                  />
                  {!item.samples.length ? (
                    <Text c="dimmed" className="mt-3" size="sm">
                      No images in this class yet.
                    </Text>
                  ) : null}
                </Box>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <Modal
        centered
        onClose={() => {
          setDeleteClassId(null);
        }}
        opened={pendingDeleteClass != null}
        title="Delete class?"
      >
        <div className="space-y-4">
          <Text c="dimmed" size="sm">
            {pendingDeleteClass
              ? `Delete "${pendingDeleteClass.name}" and all of its samples? This cannot be undone.`
              : ''}
          </Text>
          <Group justify="flex-end">
            <Button
              onClick={() => {
                setDeleteClassId(null);
              }}
              variant="default"
            >
              Cancel
            </Button>
            <Button color="red" onClick={() => void handleDeleteClass()}>
              Delete
            </Button>
          </Group>
        </div>
      </Modal>
    </Paper>
  );
}

function CameraCapturePanel({
  currentCameraClass,
  onCaptureSession,
  onRenameClass,
}: {
  currentCameraClass: NonNullable<ReturnType<typeof useProjectOne>['classes'][number]> | null;
  onCaptureSession: (session: CaptureSession) => Promise<void>;
  onRenameClass: (indexOrClassId: number | string, name: string) => void;
}) {
  if (!currentCameraClass) {
    return null;
  }

  return (
    <div>
      <CameraUI
        className="w-full"
        onCaptureSession={(session) => {
          void onCaptureSession(session);
        }}
        viewportOverlay={() => (
          <div className="absolute bottom-4 left-4 pointer-events-auto">
            <ContentEditable
              as="span"
              aria-label={`Camera class name ${currentCameraClass.name}`}
              className="inline-block w-fit max-w-full rounded-lg bg-black/45 px-3 py-2 text-xl font-semibold text-white shadow-sm backdrop-blur-sm"
              focusedClassName="bg-black/60 ring-1 ring-white/40"
              onBlur={(value) => {
                onRenameClass(currentCameraClass.id, value);
              }}
              value={currentCameraClass.name}
            />
          </div>
        )}
      />
    </div>
  );
}
