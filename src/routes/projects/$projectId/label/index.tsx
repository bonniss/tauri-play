import {
  ActionIcon,
  Button,
  Group,
  Menu,
  Modal,
  Popover,
  Text,
} from '@mantine/core';
import {
  IconChevronRight,
  IconDots,
  IconDownload,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { t, useLocale } from '~/lib/i18n';
import { toast } from 'sonner';
import CameraUI from '~/components/camera/CameraUI';
import { CaptureSession } from '~/components/camera/types';
import { Form, defineConfig } from '~/components/form';
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
import { ProjectLabelSettingsFormValues } from '~/lib/project/settings';

export const Route = createFileRoute('/projects/$projectId/label/')({
  component: ProjectLabelPage,
});


type CameraTargetState = {
  classId: string;
  createdNow: boolean;
  slot: 'class' | 'top';
};

function ProjectLabelPage() {
  useLocale()
  const labelSettingsForm = useMemo(() => defineConfig<ProjectLabelSettingsFormValues>({
    minClasses: {
      type: 'numeric',
      label: t('project.label.settings.minClasses'),
      props: { allowDecimal: false, min: 2 },
    },
    maxClasses: {
      type: 'numeric',
      label: t('project.label.settings.maxClasses'),
      props: { allowDecimal: false, min: 2, placeholder: t('common.unlimited') },
    },
    minSamplesPerClass: {
      type: 'numeric',
      label: t('project.label.settings.minSamplesPerClass'),
      props: { allowDecimal: false, min: 10 },
    },
    maxSamplesPerClass: {
      type: 'numeric',
      label: t('project.label.settings.maxSamplesPerClass'),
      props: { allowDecimal: false, min: 10, placeholder: t('common.unlimited') },
    },
  }), [])
  const {
    addSamplesToClass,
    applyLabelSettings,
    classes,
    getLabelSettingsFormValues,
    isApplyingLabelSettings,
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
  const [labelSettingsOpened, setLabelSettingsOpened] = useState(false);
  const [uploadingClassMap, setUploadingClassMap] = useState<
    Record<string, { fileCount: number; isPending: boolean }>
  >({});
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

  function handleUploadStateChange(state: {
    classId: string | null;
    fileCount: number;
    isPending: boolean;
  }) {
    if (!state.classId) {
      return;
    }

    const classId = state.classId;

    setUploadingClassMap((current) => {
      if (!state.isPending) {
        const next = { ...current };
        delete next[classId];
        return next;
      }

      return {
        ...current,
        [classId]: {
          fileCount: state.fileCount,
          isPending: state.isPending,
        },
      };
    });
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">{t('project.label.title')}</h2>
          <Popover
            onDismiss={() => {
              setLabelSettingsOpened(false);
            }}
            opened={labelSettingsOpened}
            position="bottom-end"
            shadow="md"
            width={360}
            withArrow
          >
            <Popover.Target>
              <Button
                leftSection={<IconSettings className="size-4" />}
                onClick={() => {
                  setLabelSettingsOpened((current) => !current);
                }}
                variant="default"
              >
                {t('common.settings')}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Form
                key={JSON.stringify(getLabelSettingsFormValues())}
                config={labelSettingsForm}
                defaultValues={getLabelSettingsFormValues()}
                onSubmit={async (values) => {
                  await applyLabelSettings(values);
                  setLabelSettingsOpened(false);
                }}
                renderRoot={({ children, onSubmit }) => (
                  <form className="space-y-3" onSubmit={onSubmit}>
                    <Text fw={600} size="sm">
                      {t('project.label.settingsTitle')}
                    </Text>
                    {children}
                    <Group justify="flex-end">
                      <Button
                        onClick={() => {
                          setLabelSettingsOpened(false);
                        }}
                        type="button"
                        variant="default"
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button loading={isApplyingLabelSettings} type="submit">
                        {t('common.apply')}
                      </Button>
                    </Group>
                  </form>
                )}
              />
            </Popover.Dropdown>
          </Popover>
        </div>
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
            {isTopCameraOpen ? t('project.label.closeCamera') : t('project.label.camera')}
          </ProjectActionButton>
          <UploadSamplesButton
            buttonLabel={t('common.upload')}
            className="flex-1"
          />
        </Group>
      </div>

      {isTopCameraOpen && currentCameraClass ? (
        <div className="mt-4 space-y-3">
          <CameraCapturePanel
            currentCameraClass={currentCameraClass}
            onCaptureSession={handleCameraCaptureSession}
            onRenameClass={updateClassName}
          />
        </div>
      ) : null}

      {hasClasses ? (
        <div className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {visibleClasses.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <ActionIcon
                    aria-label={openClassMap[item.id] ? 'Collapse class' : 'Expand class'}
                    onClick={() => {
                      setOpenClassMap((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }));
                    }}
                    size="xs"
                    variant="subtle"
                  >
                    <IconChevronRight
                      className={openClassMap[item.id] ? 'rotate-90 transition-transform' : 'transition-transform'}
                      size={14}
                      stroke={1.8}
                    />
                  </ActionIcon>
                  <ContentEditable
                    as="span"
                    aria-label={`Class name ${item.name}`}
                    className="inline-block w-fit max-w-full truncate rounded px-1 py-0.5 text-sm font-semibold"
                    focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                    onBlur={(value) => {
                      updateClassName(item.id, value);
                    }}
                    value={item.name}
                  />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
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
                      ? t('common.close')
                      : t('project.label.camera')}
                  </ProjectActionButton>
                  <UploadSamplesButton
                    buttonLabel={t('common.upload')}
                    classId={item.id}
                    onUploadStateChange={handleUploadStateChange}
                    size="xs"
                  />
                  <Menu position="bottom-end" shadow="md" withinPortal>
                    <Menu.Target>
                      <ActionIcon aria-label="Class actions" size="xs" variant="subtle">
                        <IconDots size={14} stroke={1.8} />
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
                        {t('common.delete')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconDownload size={14} />}
                        onClick={() => {
                          toast.message(t('project.label.exportSoon'));
                        }}
                      >
                        {t('common.export')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </div>

              {openClassMap[item.id] ? (
                <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
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
                    loading={uploadingClassMap[item.id]?.isPending ?? false}
                    onDeleteSample={handleDeleteSample}
                    samples={item.samples}
                  />
                  {!item.samples.length ? (
                    <Text c="dimmed" className="mt-3" size="sm">
                      {t('project.label.noImages')}
                    </Text>
                  ) : null}
                </div>
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
        title={t('project.label.deleteClass.title')}
      >
        <div className="space-y-4">
          <Text c="dimmed" size="sm">
            {pendingDeleteClass
              ? t('project.label.deleteClass.description', { params: { name: pendingDeleteClass.name } })
              : ''}
          </Text>
          <Group justify="flex-end">
            <Button
              onClick={() => {
                setDeleteClassId(null);
              }}
              variant="default"
            >
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={() => void handleDeleteClass()}>
              {t('project.label.deleteClass.confirm')}
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
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
        autoConnect
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
