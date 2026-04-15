import type { MobileNet } from "@tensorflow-models/mobilenet"
import type * as tf from "@tensorflow/tfjs"
import {
  Alert,
  Badge,
  Button,
  Center,
  FileButton,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
} from "@mantine/core"
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

function ProjectPlayerPage() {
  const {
    classes,
    isLoading,
    playSettings,
    projectDescription,
    projectId,
    projectName,
  } = useProjectOne()

  if (isLoading) {
    return (
      <Center className="py-20">
        <Loader />
      </Center>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="light">Project Demo</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{projectName}</h1>
          <Text c="dimmed" maw={720} size="lg">
            {projectDescription || "Try this model with your own inputs."}
          </Text>
        </div>
        <Button
          component={Link}
          leftSection={<IconArrowLeft className="size-4" />}
          params={{ projectId } as never}
          to="/projects/$projectId/play"
          variant="default"
        >
          Back to Play Settings
        </Button>
      </div>

      {playSettings.mode === "camera" ? (
        <Paper className="p-8" radius="xl" withBorder>
          <Stack align="center" gap="sm">
            <Text fw={600} size="lg">
              Camera mode is coming next.
            </Text>
            <Text c="dimmed" size="sm">
              Switch this project to upload mode for now to test the trained
              model immediately.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <UploadPlayExperience classNames={classes.map((item) => item.name)} />
      )}
    </section>
  )
}

const UploadPlayExperience: FunctionComponent<{ classNames: string[] }> = ({
  classNames,
}) => {
  const { playSettings, projectId } = useProjectOne()
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
  const classifierRef = useRef<tf.LayersModel | null>(null)
  const embeddingModelRef = useRef<MobileNet | null>(null)
  const modelClassNamesRef = useRef<string[]>(classNames)

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
        result.metadata.classNames?.length === classNames.length
          ? result.metadata.classNames
          : classNames
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
        className: modelClassNamesRef.current[index] ?? classNames[index] ?? `Class ${index + 1}`,
        confidence,
        index,
      }))
      .sort((left, right) => right.confidence - left.confidence)
  }, [classNames, prediction])

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
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Paper className="p-6" radius="xl" withBorder>
        <Stack gap="lg">
          <div className="space-y-2">
            <Text fw={600} size="lg">
              Upload an image
            </Text>
            <Text c="dimmed" size="sm">
              Try the model with a new image and see how it classifies it.
            </Text>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/60">
            <Stack align="center" gap="md">
              {selectedFileUrl ? (
                <img
                  alt={selectedFile?.name ?? "Selected upload"}
                  className="max-h-[420px] w-full rounded-xl object-contain"
                  src={selectedFileUrl}
                />
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center rounded-xl bg-white text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  No image selected yet
                </div>
              )}

              <Group>
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
                    >
                      Choose Image
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
                    variant="light"
                  >
                    Analyze
                  </Button>
                ) : null}
              </Group>
            </Stack>
          </div>
        </Stack>
      </Paper>

      <Paper className="p-6" radius="xl" withBorder>
        <Stack gap="lg">
          <div className="space-y-2">
            <Text fw={600} size="lg">
              Result
            </Text>
            <Text c="dimmed" size="sm">
              The model prediction appears here after you upload an image.
            </Text>
          </div>

          {isAnalyzing ? (
            <Center className="min-h-56">
              <Loader />
            </Center>
          ) : runtimeError ? (
            <Alert color="red" variant="light">
              {runtimeError}
            </Alert>
          ) : !prediction || !topResult ? (
            <div className="flex min-h-56 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
              Upload an image to see the prediction.
            </div>
          ) : (
            <Stack gap="md">
              <div className="rounded-2xl bg-zinc-950 px-5 py-6 text-white">
                <Text className="uppercase tracking-[0.12em] text-white/60" size="xs">
                  Predicted Class
                </Text>
                <Text className="mt-2" fw={700} size="xl">
                  {meetsThreshold ? topResult.className : "Not confident enough"}
                </Text>
                {playSettings.showConfidenceScores ? (
                  <Text className="mt-2 text-white/70" size="sm">
                    Confidence {(topResult.confidence * 100).toFixed(1)}%
                  </Text>
                ) : null}
                <Text className="mt-2 text-white/50" size="xs">
                  Inference time {prediction.predictTimeMs.toFixed(1)} ms
                </Text>
              </div>

              {playSettings.showConfidenceScores ? (
                <Stack gap="sm">
                  {visibleResults.map((result) => (
                    <div key={result.index}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Text fw={500} size="sm">
                          {result.className}
                        </Text>
                        <Text c="dimmed" size="sm">
                          {(result.confidence * 100).toFixed(1)}%
                        </Text>
                      </div>
                      <Progress radius="xl" size="lg" value={result.confidence * 100} />
                    </div>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Paper>
    </div>
  )
}
