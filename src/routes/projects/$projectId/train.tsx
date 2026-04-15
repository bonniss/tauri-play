import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Popover,
  Progress,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
} from "@mantine/core"
import { IconPlayerPlay, IconSettings } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Form, defineConfig } from "~/components/form"
import SampleGrid from "~/components/project/SampleGrid"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import {
  appendModelTrainLogEvent,
  createModelTrainLog,
  getLatestProjectTrainLog,
  getProjectModel,
  ModelTrainLogDatasetSnapshot,
  ModelTrainLogEvent,
  ModelTrainLogSummary,
  upsertProjectModel,
  updateModelTrainLogDatasetSnapshot,
  updateModelTrainLogStatus,
} from "~/lib/db/domain/models"
import { trainProjectMobilenetModel } from "~/lib/ml/mobilenet/project-train"
import { ProjectTrainSettingsFormValues } from "~/lib/project/settings"

export const Route = createFileRoute("/projects/$projectId/train")({
  component: ProjectTrainPage,
})

const trainSettingsForm = defineConfig<ProjectTrainSettingsFormValues>({
  validationSplit: {
    type: "numeric",
    label: "Validation split",
    props: {
      allowDecimal: true,
      decimalScale: 2,
      min: 0.05,
      max: 0.5,
      step: 0.05,
    },
  },
  epochs: {
    type: "numeric",
    label: "Epochs",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  batchSize: {
    type: "numeric",
    label: "Batch size",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  learningRate: {
    type: "numeric",
    label: "Learning rate",
    props: {
      allowDecimal: true,
      decimalScale: 4,
      min: 0.0001,
      max: 1,
      step: 0.0005,
    },
  },
  imageSize: {
    type: "numeric",
    label: "Image size",
    props: {
      allowDecimal: false,
      min: 32,
      step: 32,
    },
  },
  earlyStopping: {
    type: "switch",
    label: "Early stopping",
  },
  earlyStoppingPatience: {
    type: "numeric",
    label: "Early stopping patience",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
})

type ActiveTrainSession = {
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  endedAt: string | null
  events: ModelTrainLogEvent[]
  settingsSnapshot: string
  startedAt: string
  status: "started" | "completed" | "failed"
  summary: ModelTrainLogSummary | null
  trainLogId: string
}

type TrainDataView = "train" | "validation"

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatMetric(value: number | null | undefined, fractionDigits = 3) {
  if (value == null || Number.isNaN(value)) {
    return "-"
  }

  return value.toFixed(fractionDigits)
}

function renderEventMessage(event: ModelTrainLogEvent) {
  if (event.type === "phase") {
    return event.message
  }

  if (event.type === "split") {
    return `Split dataset: ${event.trainSamples} train / ${event.validationSamples} validation`
  }

  const acc = event.acc != null ? ` acc ${event.acc.toFixed(3)}` : ""
  const valAcc = event.valAcc != null ? ` val_acc ${event.valAcc.toFixed(3)}` : ""
  const valLoss =
    event.valLoss != null ? ` val_loss ${event.valLoss.toFixed(3)}` : ""

  return `Epoch ${event.epoch} - loss ${event.loss.toFixed(3)}${acc}${valAcc}${valLoss}`
}

function createPendingDatasetSnapshot(
  classes: ReturnType<typeof useProjectOne>["classes"],
): ModelTrainLogDatasetSnapshot {
  return {
    classCount: classes.length,
    totalSamples: classes.reduce((sum, item) => sum + item.samples.length, 0),
    trainSamples: 0,
    validationSamples: 0,
    samplesPerClass: classes.map((item) => ({
      classId: item.id,
      className: item.name,
      trainSampleIds: [],
      totalSamples: item.samples.length,
      trainSamples: 0,
      validationSampleIds: [],
      validationSamples: 0,
    })),
  }
}

function ProjectTrainPage() {
  const {
    applyTrainSettings,
    classes,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    isReadyForTrain,
    projectId,
    projectSettings,
    totalSamples,
    trainSettings,
  } = useProjectOne()
  const queryClient = useQueryClient()
  const [trainSettingsOpened, setTrainSettingsOpened] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveTrainSession | null>(null)
  const [trainDataView, setTrainDataView] = useState<TrainDataView>("train")
  const [now, setNow] = useState(() => Date.now())
  const activeTrainLogIdRef = useRef<string | null>(null)

  const latestModelQuery = useQuery({
    queryKey: ["project-model", projectId],
    queryFn: () => getProjectModel(projectId),
  })
  const latestTrainLogQuery = useQuery({
    queryKey: ["project-train-log", projectId],
    queryFn: () => getLatestProjectTrainLog(projectId),
  })

  const trainMutation = useMutation({
    mutationFn: async () => {
      const pendingSnapshot = createPendingDatasetSnapshot(classes)
      const startedAt = new Date().toISOString()
      const trainLogId = await createModelTrainLog({
        datasetSnapshot: pendingSnapshot,
        events: [
          {
            at: startedAt,
            message: "Training started",
            type: "phase",
          },
        ],
        projectId,
        settingsSnapshot: JSON.stringify(projectSettings.train),
        startedAt,
      })

      setActiveSession({
        datasetSnapshot: pendingSnapshot,
        endedAt: null,
        events: [
          {
            at: startedAt,
            message: "Training started",
            type: "phase",
          },
        ],
        settingsSnapshot: JSON.stringify(projectSettings.train),
        startedAt,
        status: "started",
        summary: null,
        trainLogId,
      })
      activeTrainLogIdRef.current = trainLogId

      let latestDatasetSnapshot = pendingSnapshot
      let lastEventKey = ""

      const result = await trainProjectMobilenetModel({
        batchSize: trainSettings.batchSize,
        classes: classes.map((item) => ({
          id: item.id,
          name: item.name,
          samples: item.samples.map((sample) => ({
            filePath: sample.filePath,
            id: sample.id,
            originalFileName: sample.originalFileName,
          })),
        })),
        earlyStopping: trainSettings.earlyStopping,
        earlyStoppingPatience: trainSettings.earlyStoppingPatience,
        epochs: trainSettings.epochs,
        imageSize: trainSettings.imageSize,
        learningRate: trainSettings.learningRate,
        onEvent: async (event) => {
          const eventKey = `${event.type}:${event.at}:${renderEventMessage(event)}`

          if (eventKey === lastEventKey) {
            return
          }

          lastEventKey = eventKey

          if (event.type === "split") {
            const nextSnapshot: ModelTrainLogDatasetSnapshot = {
              ...pendingSnapshot,
              trainSamples: event.trainSamples,
              validationSamples: event.validationSamples,
              samplesPerClass: latestDatasetSnapshot.samplesPerClass,
            }
            latestDatasetSnapshot = nextSnapshot
            await updateModelTrainLogDatasetSnapshot({
              datasetSnapshot: nextSnapshot,
              trainLogId,
            })
          }

          await appendModelTrainLogEvent(trainLogId, event)
          setActiveSession((current) =>
            current
              ? {
                  ...current,
                  datasetSnapshot:
                    event.type === "split"
                      ? latestDatasetSnapshot
                      : current.datasetSnapshot,
                  events: [...current.events, event],
                }
              : current,
          )
        },
        projectId,
        validationSplit: trainSettings.validationSplit,
      })

      latestDatasetSnapshot = result.datasetSnapshot
      await updateModelTrainLogDatasetSnapshot({
        datasetSnapshot: result.datasetSnapshot,
        trainLogId,
      })

      const modelId = await upsertProjectModel({
        accuracy: result.summary.accuracy,
        artifactPath: result.artifactPath,
        datasetSnapshot: JSON.stringify(result.datasetSnapshot),
        loss: result.summary.loss,
        projectId,
        settingsSnapshot: JSON.stringify(projectSettings.train),
        trainedAt: new Date().toISOString(),
        validationAccuracy: result.summary.validationAccuracy,
        validationLoss: result.summary.validationLoss,
      })

      const summary: ModelTrainLogSummary = {
        accuracy: result.summary.accuracy,
        durationMs: result.summary.durationMs,
        endedAt: new Date().toISOString(),
        loss: result.summary.loss,
        validationAccuracy: result.summary.validationAccuracy,
        validationLoss: result.summary.validationLoss,
      }

      await updateModelTrainLogStatus({
        modelId,
        status: "completed",
        summary,
        trainLogId,
      })

      setActiveSession((current) =>
        current
          ? {
                  ...current,
                  datasetSnapshot: result.datasetSnapshot,
                  endedAt: summary.endedAt,
                  status: "completed",
                  summary,
                }
              : current,
          )

      return { modelId, summary, trainLogId, datasetSnapshot: latestDatasetSnapshot }
    },
    onError: async (error) => {
      const endedAt = new Date().toISOString()
      const summary: ModelTrainLogSummary = {
        accuracy: null,
        durationMs: null,
        endedAt,
        loss: null,
        validationAccuracy: null,
        validationLoss: null,
      }

      if (activeTrainLogIdRef.current) {
        await appendModelTrainLogEvent(activeTrainLogIdRef.current, {
          at: endedAt,
          message:
            error instanceof Error ? error.message : "Training failed unexpectedly.",
          type: "phase",
        })
        await updateModelTrainLogStatus({
          status: "failed",
          summary,
          trainLogId: activeTrainLogIdRef.current,
        })
      }

      setActiveSession((current) =>
        current
          ? {
              ...current,
              endedAt,
              events: [
                ...current.events,
                {
                  at: endedAt,
                  message:
                    error instanceof Error
                      ? error.message
                      : "Training failed unexpectedly.",
                  type: "phase",
                },
              ],
              status: "failed",
              summary,
            }
          : current,
      )
      activeTrainLogIdRef.current = null
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-model", projectId] }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
      ])
      toast.error(
        error instanceof Error ? error.message : "Training failed unexpectedly.",
      )
    },
    onSuccess: async () => {
      activeTrainLogIdRef.current = null
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-model", projectId] }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ])
      toast.success("Training completed.")
    },
  })

  const displayedTrainLog = activeSession ?? latestTrainLogQuery.data
  const displayedModel = latestModelQuery.data
  const runSettings = useMemo(() => {
    if (!displayedTrainLog?.settingsSnapshot) {
      return null
    }

    try {
      return JSON.parse(displayedTrainLog.settingsSnapshot) as {
        epochs?: number
      }
    } catch {
      return null
    }
  }, [displayedTrainLog?.settingsSnapshot])
  const epochEvents = useMemo(
    () => displayedTrainLog?.events.filter((event) => event.type === "epoch") ?? [],
    [displayedTrainLog?.events],
  )
  const latestEpoch =
    epochEvents.length > 0 ? epochEvents[epochEvents.length - 1] : null
  const plannedEpochs =
    runSettings?.epochs && Number.isFinite(runSettings.epochs)
      ? Math.max(1, runSettings.epochs)
      : trainSettings.epochs
  const trainProgress = displayedTrainLog
    ? displayedTrainLog.status === "completed"
      ? 1
      : Math.min(epochEvents.length / plannedEpochs, 1)
    : 0
  const elapsedMs = displayedTrainLog
    ? new Date(displayedTrainLog.endedAt ?? now).getTime() -
      new Date(displayedTrainLog.startedAt).getTime()
    : 0

  useEffect(() => {
    if (displayedTrainLog?.status !== "started") {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [displayedTrainLog?.status])

  const sampleMap = useMemo(
    () =>
      new Map(
        classes.flatMap((item) =>
          item.samples.map((sample) => [sample.id, sample] as const),
        ),
      ),
    [classes],
  )
  const displayedSplitSamples = useMemo(() => {
    if (!displayedTrainLog) {
      return []
    }

    const sampleIds = displayedTrainLog.datasetSnapshot.samplesPerClass.flatMap(
      (item) =>
        trainDataView === "train"
          ? (item.trainSampleIds ?? [])
          : (item.validationSampleIds ?? []),
    )

    return sampleIds
      .map((sampleId) => sampleMap.get(sampleId) ?? null)
      .filter((sample): sample is NonNullable<typeof sample> => sample != null)
  }, [displayedTrainLog, sampleMap, trainDataView])

  return (
    <Paper className="p-4">
      <Stack gap="md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
          <Group gap="sm">
            <Button
              disabled={!isReadyForTrain}
              leftSection={<IconPlayerPlay className="size-4" />}
              loading={trainMutation.isPending}
              onClick={() => {
                void trainMutation.mutateAsync()
              }}
            >
              Start Training
            </Button>
            <Popover
              onDismiss={() => {
                setTrainSettingsOpened(false)
              }}
              opened={trainSettingsOpened}
              position="bottom-end"
              shadow="md"
              width={360}
              withArrow
            >
              <Popover.Target>
                <Button
                  leftSection={<IconSettings className="size-4" />}
                  onClick={() => {
                    setTrainSettingsOpened((current) => !current)
                  }}
                  variant="default"
                >
                  Settings
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Form
                  key={JSON.stringify(getTrainSettingsFormValues())}
                  config={trainSettingsForm}
                  defaultValues={getTrainSettingsFormValues()}
                  onSubmit={async (values) => {
                    await applyTrainSettings(values)
                    setTrainSettingsOpened(false)
                  }}
                  renderRoot={({ children, onSubmit }) => (
                    <form className="space-y-3" onSubmit={onSubmit}>
                      <Text fw={600} size="sm">
                        Train Settings
                      </Text>
                      {children}
                      <Group justify="flex-end">
                        <Button
                          onClick={() => {
                            setTrainSettingsOpened(false)
                          }}
                          type="button"
                          variant="default"
                        >
                          Cancel
                        </Button>
                        <Button loading={isApplyingTrainSettings} type="submit">
                          Apply
                        </Button>
                      </Group>
                    </form>
                  )}
                />
              </Popover.Dropdown>
            </Popover>
          </Group>
        </div>

        <Text c="dimmed" size="sm">
          Current dataset: {classes.length} classes, {totalSamples} samples.
        </Text>

        <Group gap="xs">
          <Badge color={isReadyForTrain ? "teal" : "yellow"} variant="light">
            {isReadyForTrain ? "Ready to train" : "Need more label data"}
          </Badge>
          <Badge variant="light">
            Validation {Math.round(trainSettings.validationSplit * 100)}%
          </Badge>
          <Badge variant="light">{trainSettings.epochs} epochs</Badge>
          <Badge variant="light">Batch {trainSettings.batchSize}</Badge>
          <Badge variant="light">LR {trainSettings.learningRate}</Badge>
        </Group>

        {!isReadyForTrain ? (
          <Alert color="yellow" variant="light">
            Label data is not ready yet. Complete the minimum class and sample requirements first.
          </Alert>
        ) : null}

        {displayedTrainLog ? (
          <Paper className="border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
            <Stack gap="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Latest training run</Text>
                  <Text c="dimmed" size="sm">
                    {displayedTrainLog.status === "started"
                      ? "Training is in progress."
                      : `Last status: ${displayedTrainLog.status}`}
                  </Text>
                </div>
                <div className="text-right">
                  <Text fw={600}>{Math.round(trainProgress * 100)}%</Text>
                  <Text c="dimmed" size="sm">
                    {epochEvents.length}/{plannedEpochs} epochs
                  </Text>
                </div>
              </Group>
              <Progress animated={displayedTrainLog.status === "started"} radius="xl" size="lg" value={trainProgress * 100} />
              <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 md:grid-cols-4">
                <MetricInline label="Elapsed" value={formatDuration(elapsedMs)} />
                <MetricInline
                  label="Loss"
                  value={formatMetric(
                    displayedTrainLog.summary?.loss ?? latestEpoch?.loss,
                  )}
                />
                <MetricInline
                  label="Val Loss"
                  value={formatMetric(
                    displayedTrainLog.summary?.validationLoss ?? latestEpoch?.valLoss,
                  )}
                />
                <MetricInline
                  label="Val Acc"
                  value={formatMetric(
                    displayedTrainLog.summary?.validationAccuracy ??
                      latestEpoch?.valAcc,
                  )}
                />
              </div>
            </Stack>
          </Paper>
        ) : (
          <Alert color="blue" variant="light">
            Training has not started yet.
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Paper className="h-full border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
              <Stack gap="sm">
                <Text fw={600}>Current model</Text>
                {displayedModel ? (
                  <>
                    <MetricRow
                      label="Trained at"
                      value={new Date(displayedModel.trainedAt).toLocaleString()}
                    />
                    <MetricRow
                      label="Accuracy"
                      value={formatMetric(displayedModel.accuracy)}
                    />
                    <MetricRow
                      label="Validation accuracy"
                      value={formatMetric(displayedModel.validationAccuracy)}
                    />
                    <MetricRow
                      label="Loss"
                      value={formatMetric(displayedModel.loss)}
                    />
                    <MetricRow
                      label="Validation loss"
                      value={formatMetric(displayedModel.validationLoss)}
                    />
                  </>
                ) : (
                  <Text c="dimmed" size="sm">
                    No trained model yet.
                  </Text>
                )}
              </Stack>
            </Paper>
          </div>

          <div>
            <Paper className="h-full border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
              <Stack gap="sm">
                <Text fw={600}>Latest run log</Text>
                {displayedTrainLog ? (
                  <ScrollArea.Autosize mah={320} type="auto">
                    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 text-zinc-100 dark:border-zinc-800">
                      <div className="border-b border-white/10 px-3 py-2 font-mono text-xs text-zinc-400">
                        train@{projectId}
                      </div>
                      <div className="space-y-1 px-3 py-3 font-mono text-xs">
                      {displayedTrainLog.events.map((event, index) => (
                        <div
                          className="leading-5"
                          key={`${event.at}-${index}`}
                        >
                          <span className="mr-2 text-zinc-500">
                            {new Date(event.at).toLocaleTimeString()}
                          </span>
                          <span>{renderEventMessage(event)}</span>
                        </div>
                      ))}
                      </div>
                    </div>
                  </ScrollArea.Autosize>
                ) : (
                  <Text c="dimmed" size="sm">
                    No train log yet.
                  </Text>
                )}
              </Stack>
            </Paper>
          </div>
        </div>

        {displayedTrainLog ? (
          <Paper className="border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>Train Data</Text>
                <SegmentedControl
                  data={[
                    {
                      label: `Train (${displayedTrainLog.datasetSnapshot.trainSamples})`,
                      value: "train",
                    },
                    {
                      label: `Validation (${displayedTrainLog.datasetSnapshot.validationSamples})`,
                      value: "validation",
                    },
                  ]}
                  onChange={(value) => {
                    setTrainDataView(value as TrainDataView)
                  }}
                  value={trainDataView}
                />
              </Group>
              <SampleGrid samples={displayedSplitSamples} />
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Paper>
  )
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <Text c="dimmed" size="xs">
        {label}
      </Text>
      <Text fw={600} mt={2} size="sm">
        {value}
      </Text>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text fw={500} size="sm">
        {value}
      </Text>
    </div>
  )
}
