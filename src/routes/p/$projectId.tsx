import type { MobileNet } from "@tensorflow-models/mobilenet"
import type * as tf from "@tensorflow/tfjs"
import { Alert, Button, FileButton, Loader, Progress, Skeleton } from "@mantine/core"
import { IconArrowLeft, IconUpload } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
      <ProjectPlayerPage />
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
  const { isLoading, playSettings, projectId, projectName } = useProjectOne()

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
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {projectName}
          </h1>
        </div>
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

      {playSettings.mode === "camera" ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Camera mode is coming next
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Switch this project back to upload mode for now if you want to test
              the current model immediately.
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
  const { classes, playSettings, projectDescription, projectId } = useProjectOne()
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
  const meetsThreshold =
    topResult != null && topResult.confidence >= playSettings.confidenceThreshold

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
        <div className="flex flex-wrap items-center gap-3">
          <FileButton
            accept="image/*"
            multiple={false}
            onChange={(file) => {
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
          >
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload className="size-4" />}
                size="md"
              >
                Upload Image
              </Button>
            )}
          </FileButton>

          {!playSettings.autoPredictOnUpload ? (
            <Button
              disabled={!selectedFile}
              loading={isAnalyzing}
              onClick={() => {
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
          ) : null}

          {selectedFile ? (
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {selectedFile.name}
            </span>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-[420px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
            {selectedFileUrl ? (
              <img
                alt={selectedFile?.name ?? "Selected upload"}
                className="h-full max-h-[680px] w-full object-contain"
                src={selectedFileUrl}
              />
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center px-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Upload an image to try the model.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div
              className="space-y-6 motion-duration-300 motion-preset-expand"
              key={predictionTick}
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                  Result
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {isAnalyzing
                    ? "Analyzing..."
                    : !prediction || !topResult
                      ? "Ready to test"
                      : meetsThreshold
                        ? topResult.className
                        : "Not confident enough"}
                </h2>
                {playSettings.showConfidenceScores && prediction && topResult ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Confidence {(topResult.confidence * 100).toFixed(1)}% ·{" "}
                    {prediction.predictTimeMs.toFixed(1)} ms
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Upload an image to see how the model responds.
                  </p>
                )}
              </div>

              {isAnalyzing ? (
                <AnalyzeSkeleton />
              ) : runtimeError ? (
                <Alert color="red" variant="light">
                  {runtimeError}
                </Alert>
              ) : !prediction || !topResult ? (
                <div className="space-y-4 rounded-2xl border border-dashed border-zinc-200 px-4 py-5 dark:border-zinc-800">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Ready to test
                    </p>
                    <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                      Upload a fresh image to compare it against {classes.length} trained
                      classes. The result panel will rank the most likely matches.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900">
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                        Mode
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        Upload
                      </p>
                    </div>
                    <div className="rounded-xl bg-zinc-100 px-3 py-3 dark:bg-zinc-900">
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                        Threshold
                      </p>
                      <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {(playSettings.confidenceThreshold * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
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
                          radius="xl"
                          size="lg"
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
              )}
            </div>
          </div>
        </div>
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
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{name}</p>
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
        <Skeleton height={32} radius="xl" width="58%" />
        <Skeleton height={12} radius="xl" width="42%" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
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
