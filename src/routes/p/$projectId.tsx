import {
  Alert,
  Badge,
  Button,
  Indicator,
  Loader,
  Paper,
  Progress,
  Skeleton,
  Text,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useFullscreenElement } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconMaximize,
  IconMinimize,
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
import { colorFromString } from '~/lib/project/class-color';
import { parseClassSettings } from '~/lib/project/class-settings';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';
import { resolveSampleFilePath } from '~/lib/project/sample-path';

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
      <div className="mb-6 flex items-start justify-between gap-4">
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
        <Paper className="relative min-h-[400px] overflow-hidden border-2 border-dashed border-zinc-400 dark:border-zinc-500">
          <Dropzone
            className="absolute inset-0"
            accept={IMAGE_MIME_TYPE}
            loading={false}
            maxFiles={1}
            multiple={false}
            onDrop={(files: File[]) => {
              const file = files[0];
              if (!file) return;
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
            {hasPreview ? (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]">
                  <img
                    alt={selectedFile?.name ?? t('project.play.demo.selectedUpload')}
                    className="h-full w-full object-contain"
                    src={selectedFileUrl as string}
                  />
                </div>
                <Dropzone.Accept>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
                    <IconUpload className="size-10 text-white" />
                    <p className="text-sm text-white">
                      {t('project.play.demo.dropzone')}
                    </p>
                  </div>
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/40">
                    <IconX className="size-10 text-white" />
                  </div>
                </Dropzone.Reject>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center gap-3 p-8">
                <Dropzone.Accept>
                  <IconUpload className="size-10 text-blue-500" />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX className="size-10 text-red-500" />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto className="size-10 text-zinc-400" />
                </Dropzone.Idle>
                <p className="text-center text-base leading-7">
                  {t('project.play.demo.dropzone')}
                </p>
              </div>
            )}
          </Dropzone>
        </Paper>

        {!playSettings.autoPredictOnUpload && selectedFile ? (
          <div>
            <Button
              disabled={!selectedFile}
              loading={isAnalyzing}
              onClick={() => {
                if (selectedFile) void runPredictionFromFile(selectedFile);
              }}
              size="md"
              variant="default"
            >
              {t('project.play.demo.predict')}
            </Button>
          </div>
        ) : null}

        {shouldShowPredictionPanel ? <PredictionPanel /> : null}
      </div>
    </PlayExperienceShell>
  );
};

const CameraPlayExperience: FunctionComponent = () => {
  const { t } = useAppProvider();
  const { classes, playSettings } = useProjectOne();
  const {
    meetsThreshold,
    prediction,
    projectModel,
    runPredictionFromVideo,
    runtimeError,
    topResult,
  } = useProjectPlayRuntime();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Windows: native Fullscreen API via useFullscreenElement
  // macOS/Linux: CSS overlay workaround (WebView doesn't support requestFullscreen)
  const isWindows = useMemo(() => /windows/i.test(navigator.userAgent), []);
  const {
    ref: nativeFsRef,
    toggle: nativeFsToggle,
    fullscreen: nativeFsActive,
  } = useFullscreenElement<HTMLDivElement>();
  const cssRef = useRef<HTMLDivElement>(null);
  const [cssFullscreen, setCssFullscreen] = useState(false);

  const containerRef = isWindows ? nativeFsRef : cssRef;
  const isFullscreen = isWindows ? nativeFsActive : cssFullscreen;
  const toggleFullscreen = isWindows
    ? nativeFsToggle
    : () => setCssFullscreen((v) => !v);

  useEffect(() => {
    if (!cssFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCssFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cssFullscreen]);

  useEffect(() => {
    if (!projectModel) {
      return;
    }

    const timer = window.setInterval(() => {
      const video = videoRef.current;

      if (!video || video.readyState < 2) {
        return;
      }

      void runPredictionFromVideo(video, { stableCommitCount: 2 });
    }, playSettings.livePredictInterval);

    return () => window.clearInterval(timer);
  }, [projectModel, playSettings.livePredictInterval, runPredictionFromVideo]);

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
          ref={containerRef}
          className={clsx(
            'bg-zinc-950',
            isFullscreen
              ? 'fixed inset-0 z-[9999] flex items-center justify-center rounded-none'
              : 'overflow-hidden rounded-2xl',
          )}
        >
          <CameraUI
            autoConnect
            aspectRatio={playSettings.liveAspectRatio}
            className={isFullscreen ? 'w-full max-h-screen' : ''}
            showModeControls={false}
            showSettings={false}
            showShutter={false}
            viewportOverlay={(context) => {
              videoRef.current = context.videoRef.current;

              return (
                <div className="pointer-events-none flex h-full flex-col justify-between p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Indicator inline processing color="red" size={12}>
                      <div className="rounded-md bg-black/40 px-2 uppercase text-white/80 backdrop-blur-sm">
                        {t('project.play.demo.liveCamera')}
                      </div>
                    </Indicator>
                    <div className="flex items-center gap-2">
                      {context.cameraState === 'ready' ? null : (
                        <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
                          {t('project.play.demo.waitingCamera')}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="pointer-events-auto rounded-full border border-white/10 bg-black/40 p-1.5 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={
                          isFullscreen
                            ? t('project.play.demo.exitFullscreen')
                            : t('project.play.demo.enterFullscreen')
                        }
                      >
                        {isFullscreen ? (
                          <IconMinimize className="size-3.5" />
                        ) : (
                          <IconMaximize className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {runtimeError ? (
                    <div className="self-center rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-xs text-red-100 backdrop-blur-sm">
                      {runtimeError}
                    </div>
                  ) : null}

                  {isFullscreen && prediction
                    ? (() => {
                        const topClassId =
                          topResult != null
                            ? (classes[topResult.index]?.id ??
                              String(topResult.index))
                            : null;
                        const topColor =
                          topClassId && meetsThreshold
                            ? colorFromString(topClassId)
                            : undefined;

                        return (
                          <div className="flex justify-center py-4">
                            <div
                              key={topResult?.index ?? 'none'}
                              className={clsx(
                                meetsThreshold &&
                                  topResult &&
                                  'motion-preset-confetti',
                              )}
                            >
                              <Badge
                                variant="light"
                                size="xl"
                                radius="md"
                                color={topColor}
                                className="py-10 opacity-90 font-serif leading-loose normal-case"
                              >
                                <Text
                                  c={topColor ?? 'white'}
                                  fw={700}
                                  className="text-5xl leading-relaxed"
                                >
                                  {meetsThreshold && topResult
                                    ? topResult.className
                                    : t('project.play.demo.notConfident')}
                                </Text>
                              </Badge>
                            </div>
                          </div>
                        );
                      })()
                    : null}
                </div>
              );
            }}
          />
        </div>

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
          <MarkdownViewer className="text-xs prose-sm leading-[0.5]">
            {projectDescription || t('project.play.demo.noDescription')}
          </MarkdownViewer>
        </section>
      </aside>

      {children}
    </div>
  );
};

const PredictionPanel: FunctionComponent = () => {
  const { t } = useAppProvider();
  const { classes, playSettings } = useProjectOne();
  const {
    isAnalyzing,
    meetsThreshold,
    prediction,
    runtimeError,
    topResult,
    visibleResults,
  } = useProjectPlayRuntime();

  const showSkeleton = isAnalyzing && !prediction;

  return (
    <Paper withBorder className="py-4 px-6">
      <div className="space-y-5">
        {/* Header: live indicator + inference time */}
        {showSkeleton ? (
          <AnalyzeSkeleton />
        ) : runtimeError ? (
          <Alert color="red" variant="light">
            {runtimeError}
          </Alert>
        ) : prediction && topResult ? (
          <div className="space-y-3">
            {playSettings.showConfidenceScores ? (
              <>
                {visibleResults.map((result) => {
                  const cls = classes[result.index];
                  const classId = cls?.id ?? String(result.index);
                  const liveName = cls?.name ?? result.className;
                  const color =
                    parseClassSettings(cls?.settings).classColor ??
                    colorFromString(classId);
                  const isTop =
                    result.index === topResult.index && meetsThreshold;

                  return (
                    <div key={result.index}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span
                          className={clsx(
                            'font-serif font-semibold leading-tight',
                            isTop
                              ? 'motion-preset-confetti text-xl'
                              : 'text-base',
                          )}
                        >
                          {liveName}
                        </span>
                        <span className="shrink-0 text-base font-light tabular-nums text-zinc-500 dark:text-zinc-400">
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        color={color}
                        radius="xl"
                        size={isTop ? 'md' : 'sm'}
                        styles={{ section: { transition: 'width 350ms ease' } }}
                        value={result.confidence * 100}
                      />
                    </div>
                  );
                })}
                <Text c="dimmed" className="!mt-6 text-sm text-right font-mono">
                  {prediction.predictTimeMs.toFixed(1)} ms
                </Text>
              </>
            ) : (
              <div className="rounded-2xl bg-zinc-100 px-4 py-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {t('project.play.demo.confidenceDisabled')}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Paper>
  );
};

const ClassPreviewItem: FunctionComponent<{
  classId: string;
  name: string;
  samples: Array<{
    classId: string;
    fileName: string;
    id: string;
    projectId: string;
  }>;
}> = ({ classId, name, samples }) => {
  const { appSettings, t } = useAppProvider();
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
      previewSamples.map((sample) => createSamplePreviewUrl(resolveSampleFilePath(appSettings.samplePathPattern, sample.projectId, sample.classId, sample.fileName))),
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
      <p className="font-serif text-base font-medium truncate text-ellipsis">
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
