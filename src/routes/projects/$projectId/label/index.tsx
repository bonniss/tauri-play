import { ActionIcon, Box, Button, Group, Paper } from '@mantine/core';
import { IconCamera, IconChevronRight } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CameraUI from '~/components/camera/CameraUI';
import { CaptureSession } from '~/components/camera/types';
import ContentEditable from '~/components/headless/ContentEditable';
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
  const [cameraClassState, setCameraClassState] = useState<{
    classId: string;
    createdNow: boolean;
  } | null>(null);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isPersistingCameraFrames, setIsPersistingCameraFrames] = useState(false);
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
  const currentCameraClass = cameraClassState
    ? classes.find((item) => item.id === cameraClassState.classId) ?? null
    : null;
  const isCameraOpen = currentCameraClass != null;

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

  async function openInlineCamera() {
    if (cameraClassState || isOpeningCamera || isPersistingCameraFrames) {
      return;
    }

    setIsOpeningCamera(true);
    const seededClass = seedClass();
    setCameraClassState({
      classId: seededClass.id,
      createdNow: true,
    });
    setOpenClassMap((current) => ({
      ...current,
      [seededClass.id]: true,
    }));

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
      setCameraClassState(null);
      toast.error('Failed to create camera class.');
    } finally {
      setIsOpeningCamera(false);
    }
  }

  async function closeInlineCamera() {
    if (!cameraClassState || isOpeningCamera || isPersistingCameraFrames) {
      return;
    }

    const cameraClass = classes.find((item) => item.id === cameraClassState.classId);
    const shouldDeleteEmptySeededClass =
      cameraClassState.createdNow && cameraClass != null && cameraClass.samples.length === 0;

    if (shouldDeleteEmptySeededClass) {
      try {
        await deleteClass(cameraClassState.classId);
        removeClass(cameraClassState.classId);
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
        toast.error('Failed to clean up empty camera class.');
      }
    }

    setCameraClassState(null);
  }

  async function persistCameraFrames(session: CaptureSession) {
    if (!cameraClassState) {
      return;
    }

    setIsPersistingCameraFrames(true);

    try {
      const nextSamples = await saveCapturedSampleFrames({
        classId: cameraClassState.classId,
        frames: session.frames,
        projectId,
      });
      const optimisticSamples = addSamplesToClass(cameraClassState.classId, nextSamples);
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
          cameraClassState.classId,
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
        <Group>
          <Button
            loading={isOpeningCamera}
            leftSection={<IconCamera className="size-4" />}
            onClick={() => {
              if (isCameraOpen) {
                void closeInlineCamera();
                return;
              }

              void openInlineCamera();
            }}
            variant="default"
          >
            {isCameraOpen ? 'Close Camera' : 'Camera'}
          </Button>
          <UploadSamplesButton buttonLabel="Upload" />
        </Group>
      </div>

      {isCameraOpen && currentCameraClass ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {isPersistingCameraFrames ? 'Saving captures...' : 'Camera capture'}
            </div>
            <Button
              disabled={isPersistingCameraFrames || isOpeningCamera}
              onClick={() => {
                void closeInlineCamera();
              }}
              size="xs"
              variant="default"
            >
              Done
            </Button>
          </div>

          <CameraUI
            className="w-full"
            onCaptureSession={(session) => {
              void handleCameraCaptureSession(session);
            }}
            viewportOverlay={() => (
              <div className="absolute bottom-4 left-4 pointer-events-auto">
                <ContentEditable
                  as="span"
                  aria-label={`Camera class name ${currentCameraClass.name}`}
                  className="inline-block w-fit max-w-full rounded-lg bg-black/45 px-3 py-2 text-xl font-semibold text-white shadow-sm backdrop-blur-sm"
                  focusedClassName="bg-black/60 ring-1 ring-white/40"
                  onBlur={(value) => {
                    updateClassName(currentCameraClass.id, value);
                  }}
                  value={currentCameraClass.name}
                />
              </div>
            )}
          />
        </div>
      ) : null}

      {hasClasses ? (
        <div className="mt-6 space-y-4">
          {classes.map((item) => (
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
                  <UploadSamplesButton
                    buttonLabel="Upload"
                    classId={item.id}
                  />
                </div>
              </div>

              {openClassMap[item.id] ? (
              <Box className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                <SampleGrid
                  onDeleteSample={handleDeleteSample}
                  samples={item.samples}
                />
              </Box>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Paper>
  );
}
