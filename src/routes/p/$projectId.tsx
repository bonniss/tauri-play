import { Alert, Button, Loader, Paper, Progress, Skeleton } from "@mantine/core"
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone"
import {
  IconArrowLeft,
  IconPhoto,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { MobileNet } from "@tensorflow-models/mobilenet"
import type * as tf from "@tensorflow/tfjs"
import clsx from "clsx"
import { FunctionComponent, useEffect, useMemo, useRef, useState } from "react"
import PlayRuntimeSettings from "~/components/project/play/PlayRuntimeSettings"
import { ProjectPlayProvider } from "~/components/project/play/ProjectPlayProvider"
import {
  ProjectOneProvider,
  useProjectOne,
} from "~/components/project/ProjectOneProvider"
import { getProjectModel } from "~/lib/db/domain/models"
import { initTf } from "~/lib/ml/backend"
import { loadMobilenetModel } from "~/lib/ml/mobilenet/model"
import { predictWithMobilenetClassifier } from "~/lib/ml/mobilenet/predict"
import { loadMobilenetClassifierModel } from "~/lib/ml/mobilenet/storage"
import { fileToImageTensor } from "~/lib/ml/sample/image"
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from "~/lib/project/sample-preview"

export const Route = createFileRoute("/p/$projectId")({
  component: ProjectPlayerRoute,
})

function ProjectPlayerRoute() {
  const { projectId } = Route.useParams()

  return (
    <ProjectOneProvider defaultValue={{ projectId }}>
      <ProjectPlayProvider>
        <ProjectPlayerPage />
      </ProjectPlayProvider>
    </ProjectOneProvider>
  )
}

function formatRelativeTime(input: string) {
  const value = new Date(input).getTime()
  const diffMs = value - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute")
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour")
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, "day")
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function pickSeededSamples<T extends { id: string }>(
  items: T[],
  seed: string,
  count: number,
) {
  if (items.length <= count) {
    return items
  }

  const pool = [...items]
  const picked: T[] = []
  let hash = hashString(seed)

  while (pool.length > 0 && picked.length < count) {
    const index = hash % pool.length
    picked.push(pool.splice(index, 1)[0])
    hash = hashString(`${seed}:${hash}:${picked.length}`)
  }

  return picked
}

function ProjectPlayerPage() {
  const { isLoading, playSettings, projectIcon, projectId, projectName } =
    useProjectOne()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
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
            Back
          </Button>
        </div>
      </div>

      {playSettings.mode === "camera" ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Camera mode is coming next
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Switch this project back to upload mode for now if you want to
              test the current model immediately.
            </p>
          </div>
        </div>
      ) : (
        <UploadPlayExperience />
      )}
    </section>
  )
}

const UploadPlayExperience: FunctionComponent = () => {
  const { classes, playSettings, projectDescription, projectId } =
    useProjectOne()
  const projectModelQuery = useQuery({
    queryKey: ["project-model", projectId],
    queryFn: () => getProjectModel(projectId),
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<{
    confidences: number[]
    predictedClass: number
    predictTimeMs: number
  } | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictionTick, setPredictionTick] = useState(0)
  const classifierRef = useRef<tf.LayersModel | null>(null)
  const embeddingModelRef = useRef<MobileNet | null>(null)
  const modelClassNamesRef = useRef<string[]>(classes.map((item) => item.name))

  useEffect(() => {
    return () => {
      classifierRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFileUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(selectedFile)
    setSelectedFileUrl(nextUrl)

    return () => {
      URL.revokeObjectURL(nextUrl)
    }
  }, [selectedFile])

  async function ensureModelsReady() {
    if (!projectModelQuery.data?.artifactPath) {
      throw new Error("No trained model found for this project.")
    }

    if (!embeddingModelRef.current) {
      await initTf()
      embeddingModelRef.current = await loadMobilenetModel()
    }

    if (!classifierRef.current) {
      const result = await loadMobilenetClassifierModel(
        projectModelQuery.data.artifactPath,
      )
      classifierRef.current = result.model
      modelClassNamesRef.current =
        result.metadata.classNames?.length === classes.length
          ? result.metadata.classNames
          : classes.map((item) => item.name)
    }
  }

  async function runPrediction(file: File) {
    setIsAnalyzing(true)
    setRuntimeError(null)

    try {
      await ensureModelsReady()

      const result = await predictWithMobilenetClassifier({
        classifier: classifierRef.current as tf.LayersModel,
        embeddingModel: embeddingModelRef.current as MobileNet,
        file,
        fileToTensor: fileToImageTensor,
        imageSize: 224,
      })

      setPrediction(result)
      setPredictionTick((current) => current + 1)
    } catch (error) {
      setPrediction(null)
      setRuntimeError(
        error instanceof Error ? error.message : "Prediction failed.",
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const rankedResults = useMemo(() => {
    if (!prediction) {
      return []
    }

    return prediction.confidences
      .map((confidence, index) => ({
        className:
          modelClassNamesRef.current[index] ??
          classes[index]?.name ??
          `Class ${index + 1}`,
        confidence,
        index,
      }))
      .sort((left, right) => right.confidence - left.confidence)
  }, [classes, prediction])

  const visibleResults = playSettings.showAllClasses
    ? rankedResults
    : rankedResults.slice(0, playSettings.topK)
  const topResult = rankedResults[0] ?? null
  const hasPreview = Boolean(selectedFileUrl)
  const meetsThreshold =
    topResult != null &&
    topResult.confidence >= playSettings.confidenceThreshold
  const shouldShowPredictionPanel =
    hasPreview && (isAnalyzing || runtimeError != null || prediction != null)

  if (!projectModelQuery.data) {
    return (
      <Alert color="yellow" variant="light">
        This project does not have a trained model yet.
      </Alert>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Model
          </p>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Updated{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {formatRelativeTime(projectModelQuery.data.trainedAt)}
            </span>
          </p>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            Classes
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
            Description
          </p>
          <div className="max-h-72 overflow-y-auto pr-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <div className="whitespace-pre-wrap">
              {projectDescription || "No project description yet."}
            </div>
          </div>
        </section>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <div
          className={clsx(
            hasPreview &&
              "grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]",
          )}
        >
          <Paper
            className={clsx(
              "min-h-[400px] relative border border-dashed border-zinc-400 dark:border-zinc-500 order-2",
            )}
          >
            <Dropzone
              className={clsx(
                "p-4 flex justify-center items-center absolute inset-0",
              )}
              accept={IMAGE_MIME_TYPE}
              loading={false}
              maxFiles={1}
              multiple={false}
              onDrop={(files: File[]) => {
                const file = files[0]

                if (!file) {
                  return
                }

                setSelectedFile(file)
                setPrediction(null)
                setRuntimeError(null)

                if (playSettings.autoPredictOnUpload) {
                  void runPrediction(file)
                }
              }}
              onReject={() => {
                setRuntimeError("Please upload a valid image file.")
              }}
            >
              <div
                className={clsx(
                  "flex gap-4 items-center",
                  hasPreview ? "flex-col" : "flex-row",
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
                      hasPreview ? "text-sm" : "text-base leading-7"
                    }`}
                  >
                    Drop an image here, <br /> or click to browse from your
                    device.
                  </p>
                  {selectedFile ? (
                    <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      Current file: {selectedFile.name}
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
                      event.stopPropagation()

                      if (!selectedFile) {
                        return
                      }

                      void runPrediction(selectedFile)
                    }}
                    size="md"
                    variant="default"
                  >
                    Predict
                  </Button>
                </div>
              ) : null}
            </Dropzone>
          </Paper>

          {hasPreview ? (
            <Paper
              className="h-[500px] relative overflow-hidden
    bg-[repeating-linear-gradient(135deg,rgba(229,231,235,0.5)_0px,rgba(229,231,235,0.5)_1px,transparent_1px,transparent_12px)]
    dark:bg-[repeating-linear-gradient(135deg,rgba(55,65,81,0.5)_0px,rgba(55,65,81,0.5)_1px,transparent_1px,transparent_12px)] drop-shadow-md"
              withBorder
            >
              <img
                alt={selectedFile?.name ?? "Selected upload"}
                className="h-full w-full object-contain"
                src={selectedFileUrl as string}
              />
            </Paper>
          ) : null}
        </div>

        {shouldShowPredictionPanel ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="space-y-6" key={predictionTick}>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  <span
                    className={
                      !isAnalyzing && prediction && topResult && meetsThreshold
                        ? "inline-block motion-preset-confetti"
                        : ""
                    }
                  >
                    {isAnalyzing
                      ? "Analyzing..."
                      : meetsThreshold && topResult
                        ? topResult.className
                        : "Not confident enough"}
                  </span>
                </h2>
                {playSettings.showConfidenceScores &&
                prediction &&
                topResult ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Confidence {(topResult.confidence * 100).toFixed(1)}% ·{" "}
                    {prediction.predictTimeMs.toFixed(1)} ms
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
                      Confidence display is disabled for this play mode.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const ClassPreviewItem: FunctionComponent<{
  classId: string
  name: string
  samples: Array<{
    filePath: string
    id: string
  }>
}> = ({ classId, name, samples }) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const previewSamples = useMemo(
    () => pickSeededSamples(samples, classId, 4),
    [classId, samples],
  )

  useEffect(() => {
    let cancelled = false
    let nextUrls: string[] = []

    if (!previewSamples.length) {
      setPreviewUrls([])
      return
    }

    void Promise.all(
      previewSamples.map((sample) => createSamplePreviewUrl(sample.filePath)),
    ).then((urls) => {
      if (cancelled) {
        urls.forEach((url) => revokeSamplePreviewUrl(url))
        return
      }

      nextUrls = urls
      setPreviewUrls(urls)
    })

    return () => {
      cancelled = true
      nextUrls.forEach((url) => revokeSamplePreviewUrl(url))
    }
  }, [previewSamples])

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
            No samples yet
          </div>
        )}
      </div>
    </div>
  )
}

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
  )
}
