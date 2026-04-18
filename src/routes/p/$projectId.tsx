import {
  Alert,
  Button,
  Loader,
  Paper,
  Progress,
  Skeleton,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import {
  IconArrowLeft,
  IconPhoto,
  IconUpload,
  IconX,
} from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  FunctionComponent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CameraUI from '~/components/camera/CameraUI';
import { useAppProvider } from '~/components/layout/AppProvider';
import PlayRuntimeSettings from '~/components/project/play/PlayRuntimeSettings';
import { ProjectPlayProvider } from '~/components/project/play/ProjectPlayProvider';
import {
  ProjectPlayRuntimeProvider,
  useProjectPlayRuntime,
} from '~/components/project/play/ProjectPlayRuntimeProvider';
import {
  ProjectOneProvider,
  useProjectOne,
} from '~/components/project/ProjectOneProvider';
import MarkdownViewer from '~/components/shared/MarkdownViewer';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';

export const Route = createFileRoute('/p/$projectId')({
  component: ProjectPlayerRoute,
});

function ProjectPlayerRoute() {
  const { projectId } = Route.useParams();

  return (
    <ProjectOneProvider defaultValue={{ projectId }}>
      <ProjectPlayProvider>
        <ProjectPlayRuntimeProvider>
          <ProjectPlayerPage />
        </ProjectPlayRuntimeProvider>
      </ProjectPlayProvider>
    </ProjectOneProvider>
  );
}

function formatRelativeTime(input: string, locale: string) {
  const value = new Date(input).getTime();
  const diffMs = value - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function pickSeededSamples<T extends { id: string }>(
  items: T[],
  seed: string,
  count: number,
) {
  if (items.length <= count) {
    return items;
  }

  const pool = [...items];
  const picked: T[] = [];
  let hash = hashString(seed);

  while (pool.length > 0 && picked.length < count) {
    const index = hash % pool.length;
    picked.push(pool.splice(index, 1)[0]);
    hash = hashString(`${seed}:${hash}:${picked.length}`);
  }

  return picked;
}

function ProjectPlayerPage() {
  const { t } = useAppProvider();
  const { isLoading, playSettings, projectIcon, projectId, projectName } =
    useProjectOne();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            <span className="text-3xl leading-none">{projectIcon}</span>
            {projectName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <PlayRuntimeSettings />
          <Button
            component={Link}
            leftSection={<IconArrowLeft className="size-4" />}
            params={{ projectId } as never}
            to="/projects/$projectId/play"
            variant="default"
          >
            {t('project.play.back')}
          </Button>
        </div>
      </div>

      {playSettings.mode === 'camera' ? (
        <CameraPlayExperience />
      ) : (
        <UploadPlayExperience />
      )}
    </section>
  );
}

const UploadPlayExperience: FunctionComponent = () => {
  const { t } = useAppProvider();
  const { playSettings } = useProjectOne();
  const {
    clearPrediction,
    isAnalyzing,
    prediction,
    projectModel,
    runPredictionFromFile,
    runtimeError,
  } = useProjectPlayRuntime();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFileUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setSelectedFileUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [selectedFile]);

  const hasPreview = Boolean(selectedFileUrl);
  const shouldShowPredictionPanel =
    hasPreview && (isAnalyzing || runtimeError != null || prediction != null);

  if (!projectModel) {
    return (
      <Alert color="yellow" variant="light">
        {t('project.play.demo.noModel')}
      </Alert>
    );
  }

  return (
    <PlayExperienceShell trainedAt={projectModel.trainedAt}>
      <div className="flex min-w-0 flex-col gap-6">
        <div
          className={clsx(
            hasPreview &&
              'grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]',
          )}
        >
          <Paper
            className={clsx(
              'min-h-[400px] relative border border-dashed border-zinc-400 dark:border-zinc-500 order-2',
            )}
          >
            <Dropzone
              className={clsx(
                'absolute inset-0 flex items-center justify-center p-4',
              )}
              accept={IMAGE_MIME_TYPE}
              loading={false}
              maxFiles={1}
              multiple={false}
              onDrop={(files: File[]) => {
                const file = files[0];

                if (!file) {
                  return;
                }

                setSelectedFile(file);
                clearPrediction();

                if (playSettings.autoPredictOnUpload) {
                  void runPredictionFromFile(file);
                }
              }}
              onReject={() => {
                clearPrediction();
              }}
            >
              <div
                className={clsx(
                  'flex items-center gap-4',
                  hasPreview ? 'flex-col' : 'flex-row',
                )}
              >
                <div>
                  <Dropzone.Accept>
                    <IconUpload className="size-10" />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX className="size-10" />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconPhoto className="size-10" />
                  </Dropzone.Idle>
                </div>

                <div>
                  <p
                    className={`text-zinc-500 dark:text-zinc-400 ${
                      hasPreview ? 'text-sm' : 'text-base leading-7'
                    }`}
                  >
                    {t('project.play.demo.dropzone')}
                  </p>
                  {selectedFile ? (
                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {t('project.play.demo.currentFile', {
                        params: { name: selectedFile.name },
                      })}
                    </p>
                  ) : null}
                </div>
              </div>

              {!playSettings.autoPredictOnUpload ? (
                <div className="pt-4">
                  <Button
                    disabled={!selectedFile}
                    loading={isAnalyzing}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (!selectedFile) {
                        return;
                      }

                      void runPredictionFromFile(selectedFile);
                    }}
                    size="md"
                    variant="default"
                  >
                    {t('project.play.demo.predict')}
                  </Button>
                </div>
              ) : null}
            </Dropzone>
          </Paper>

          {hasPreview ? (
            <Paper
              className={clsx(
                'relative h-[500px] overflow-hidden',
                'bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]',
              )}
              withBorder
            >
              <img
                alt={selectedFile?.name ?? 'Selected upload'}
                className="h-full w-full object-contain"
                src={selectedFileUrl as string}
              />
            </Paper>
          ) : null}
        </div>

        {shouldShowPredictionPanel ? <PredictionPanel /> : null}
      </div>
    </PlayExperienceShell>
  );
};

const CameraPlayExperience: FunctionComponent = () => {
  const { t } = useAppProvider();
  const { prediction, projectModel, runPredictionFromVideo, runtimeError } =
    useProjectPlayRuntime();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!projectModel) {
      return;
    }

    const timer = window.setInterval(() => {
      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        return;
      }

      void runPredictionFromVideo(video, {
        stableCommitCount: 2,
      });
    }, 700);

    return () => {
      window.clearInterval(timer);
    };
  }, [projectModel, runPredictionFromVideo]);

  if (!projectModel) {
    return (
      <Alert color="yellow" variant="light">
        {t('project.play.demo.noModel')}
      </Alert>
    );
  }

  return (
    <PlayExperienceShell trainedAt={projectModel.trainedAt}>
      <div className="flex min-w-0 flex-col gap-6">
        <Paper
          className="relative min-h-[500px] overflow-hidden border border-zinc-200 dark:border-zinc-800"
          withBorder
        >
          <CameraUI
            autoConnect
            className="h-full"
            showModeControls={false}
            showSettings={false}
            showShutter={false}
            viewportOverlay={(context) => {
              videoRef.current = context.videoRef.current;

              return (
                <div className="flex h-full flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
                      {t('project.play.demo.liveCamera')}
                    </div>
                    <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
                      {context.cameraState === 'ready'
                        ? t('project.play.demo.analyzingFeed')
                        : t('project.play.demo.waitingCamera')}
                    </div>
                  </div>
                  {runtimeError ? (
                    <div className="self-center rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs text-red-100 backdrop-blur-sm">
                      {runtimeError}
                    </div>
                  ) : null}
                </div>
              );
            }}
          />
        </Paper>

        {prediction || runtimeError ? <PredictionPanel /> : null}
      </div>
    </PlayExperienceShell>
  );
};

const PlayExperienceShell: FunctionComponent<{
  children: ReactNode;
  trainedAt: string;
}> = ({ children, trainedAt }) => {
  const { t, locale } = useAppProvider();
  const { classes, projectDescription } = useProjectOne();

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {t('project.play.demo.modelSection')}
          </p>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {t('project.play.demo.updatedAt', {
              params: { time: formatRelativeTime(trainedAt, locale) },
            })}
          </p>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {t('project.play.demo.classesSection')}
          </p>
          <div className="space-y-4">
            {classes.map((projectClass) => (
              <ClassPreviewItem
                classId={projectClass.id}
                key={projectClass.id}
                name={projectClass.name}
                samples={projectClass.samples}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            {t('project.play.demo.descriptionSection')}
          </p>
          <div className="max-h-72 overflow-y-auto pr-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <MarkdownViewer className="prose-sm">
              {projectDescription || t('project.play.demo.noDescription')}
            </MarkdownViewer>
          </div>
        </section>
      </aside>

      {children}
    </div>
  );
};

const PredictionPanel: FunctionComponent = () => {
  const { t } = useAppProvider();
  const { playSettings } = useProjectOne();
  const {
    isAnalyzing,
    meetsThreshold,
    prediction,
    predictionTick,
    runtimeError,
    topResult,
    visibleResults,
  } = useProjectPlayRuntime();

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="space-y-6" key={predictionTick}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            <span
              className={
                !isAnalyzing && prediction && topResult && meetsThreshold
                  ? 'inline-block motion-preset-confetti'
                  : ''
              }
            >
              {isAnalyzing
                ? t('project.play.demo.analyzing')
                : meetsThreshold && topResult
                  ? topResult.className
                  : t('project.play.demo.notConfident')}
            </span>
          </h2>
          {playSettings.showConfidenceScores && prediction && topResult ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('project.play.demo.confidence', {
                params: {
                  percent: (topResult.confidence * 100).toFixed(1),
                  ms: prediction.predictTimeMs.toFixed(1),
                },
              })}
            </p>
          ) : null}
        </div>

        {isAnalyzing ? (
          <AnalyzeSkeleton />
        ) : runtimeError ? (
          <Alert color="red" variant="light">
            {runtimeError}
          </Alert>
        ) : prediction && topResult ? (
          <div className="space-y-4">
            {playSettings.showConfidenceScores ? (
              visibleResults.map((result) => (
                <div key={result.index}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {result.className}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    animated={false}
                    radius="xl"
                    size="sm"
                    value={result.confidence * 100}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-zinc-100 px-4 py-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {t('project.play.demo.confidenceDisabled')}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ClassPreviewItem: FunctionComponent<{
  classId: string;
  name: string;
  samples: Array<{
    filePath: string;
    id: string;
  }>;
}> = ({ classId, name, samples }) => {
  const { t } = useAppProvider();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewSamples = useMemo(
    () => pickSeededSamples(samples, classId, 4),
    [classId, samples],
  );

  useEffect(() => {
    let cancelled = false;
    let nextUrls: string[] = [];

    if (!previewSamples.length) {
      setPreviewUrls([]);
      return;
    }

    void Promise.all(
      previewSamples.map((sample) => createSamplePreviewUrl(sample.filePath)),
    ).then((urls) => {
      if (cancelled) {
        urls.forEach((url) => revokeSamplePreviewUrl(url));
        return;
      }

      nextUrls = urls;
      setPreviewUrls(urls);
    });

    return () => {
      cancelled = true;
      nextUrls.forEach((url) => revokeSamplePreviewUrl(url));
    };
  }, [previewSamples]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {name}
      </p>
      <div className="flex gap-2">
        {previewUrls.length ? (
          previewUrls.map((url, index) => (
            <img
              alt={`${name} sample ${index + 1}`}
              className="size-[60px] rounded-xl object-cover"
              key={url}
              src={url}
            />
          ))
        ) : (
          <div className="flex h-[60px] w-full items-center rounded-xl border border-dashed border-zinc-200 px-3 text-xs text-zinc-400 dark:border-zinc-800">
            {t('project.play.demo.noSamples')}
          </div>
        )}
      </div>
    </div>
  );
};

function AnalyzeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton height={14} radius="xl" width="24%" />
      </div>
      <div className="space-y-4">
        {[0].map((index) => (
          <div className="space-y-2 motion-preset-fade" key={index}>
            <div className="flex items-center justify-between gap-3">
              <Skeleton height={12} radius="xl" width={`${48 - index * 6}%`} />
              <Skeleton height={12} radius="xl" width="16%" />
            </div>
            <Skeleton height={16} radius="xl" width="100%" />
          </div>
        ))}
      </div>
    </div>
  );
}
