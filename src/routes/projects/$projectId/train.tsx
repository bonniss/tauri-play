import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Popover,
  Progress,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { Form, defineConfig } from "~/components/form"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import {
  getLatestProjectTrainLog,
  getProjectModel,
  ModelTrainLogEvent,
} from "~/lib/db/domain/models"
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

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatMetric(value: number | null | undefined, fractionDigits = 3) {
  if (value == null || Number.isNaN(value)) {
    return "—"
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

  const acc =
    event.acc != null ? ` acc ${event.acc.toFixed(3)}` : ""
  const valAcc =
    event.valAcc != null ? ` val_acc ${event.valAcc.toFixed(3)}` : ""
  const valLoss =
    event.valLoss != null ? ` val_loss ${event.valLoss.toFixed(3)}` : ""

  return `Epoch ${event.epoch} - loss ${event.loss.toFixed(3)}${acc}${valAcc}${valLoss}`
}

function ProjectTrainPage() {
  const {
    applyTrainSettings,
    classes,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    isReadyForTrain,
    projectId,
    totalSamples,
    trainSettings,
  } = useProjectOne()
  const [trainSettingsOpened, setTrainSettingsOpened] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const latestModelQuery = useQuery({
    queryKey: ["project-model", projectId],
    queryFn: () => getProjectModel(projectId),
  })
  const latestTrainLogQuery = useQuery({
    queryKey: ["project-train-log", projectId],
    queryFn: () => getLatestProjectTrainLog(projectId),
  })

  const latestTrainLog = latestTrainLogQuery.data
  const latestModel = latestModelQuery.data
  const epochEvents = useMemo(
    () => latestTrainLog?.events.filter((event) => event.type === "epoch") ?? [],
    [latestTrainLog?.events],
  )
  const latestEpoch =
    epochEvents.length > 0 ? epochEvents[epochEvents.length - 1] : null
  const trainProgress = latestTrainLog
    ? Math.min(epochEvents.length / trainSettings.epochs, 1)
    : 0
  const elapsedMs = latestTrainLog
    ? new Date(latestTrainLog.endedAt ?? now).getTime() -
      new Date(latestTrainLog.startedAt).getTime()
    : 0

  useEffect(() => {
    if (latestTrainLog?.status !== "started") {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [latestTrainLog?.status])

  return (
    <Paper className="p-4">
      <Stack gap="md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
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

        {latestTrainLog ? (
          <Paper className="border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
            <Stack gap="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>Latest training run</Text>
                  <Text c="dimmed" size="sm">
                    {latestTrainLog.status === "started"
                      ? "Training is in progress."
                      : `Last status: ${latestTrainLog.status}`}
                  </Text>
                </div>
                <div className="text-right">
                  <Text fw={600}>{Math.round(trainProgress * 100)}%</Text>
                  <Text c="dimmed" size="sm">
                    {epochEvents.length}/{trainSettings.epochs} epochs
                  </Text>
                </div>
              </Group>
              <Progress radius="xl" size="lg" value={trainProgress * 100} />
              <Group grow>
                <MetricCard
                  label="Elapsed"
                  value={formatDuration(elapsedMs)}
                />
                <MetricCard
                  label="Loss"
                  value={formatMetric(
                    latestTrainLog.summary?.loss ?? latestEpoch?.loss,
                  )}
                />
                <MetricCard
                  label="Val Loss"
                  value={formatMetric(
                    latestTrainLog.summary?.validationLoss ?? latestEpoch?.valLoss,
                  )}
                />
                <MetricCard
                  label="Val Acc"
                  value={formatMetric(
                    latestTrainLog.summary?.validationAccuracy ?? latestEpoch?.valAcc,
                  )}
                />
              </Group>
            </Stack>
          </Paper>
        ) : (
          <Alert color="blue" variant="light">
            Training has not started yet. Settings and log storage are ready; the train action comes next.
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Paper className="h-full border border-zinc-200 p-4 dark:border-zinc-800" radius="lg">
              <Stack gap="sm">
                <Text fw={600}>Current model</Text>
                {latestModel ? (
                  <>
                    <MetricRow label="Trained at" value={new Date(latestModel.trainedAt).toLocaleString()} />
                    <MetricRow label="Accuracy" value={formatMetric(latestModel.accuracy)} />
                    <MetricRow
                      label="Validation accuracy"
                      value={formatMetric(latestModel.validationAccuracy)}
                    />
                    <MetricRow label="Loss" value={formatMetric(latestModel.loss)} />
                    <MetricRow
                      label="Validation loss"
                      value={formatMetric(latestModel.validationLoss)}
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
                {latestTrainLog ? (
                  <ScrollArea.Autosize mah={320} type="auto">
                    <div className="space-y-2">
                      {latestTrainLog.events.map((event, index) => (
                        <div
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                          key={`${event.at}-${index}`}
                        >
                          <div className="font-medium">{renderEventMessage(event)}</div>
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(event.at).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
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
      </Stack>
    </Paper>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 px-3 py-3 dark:border-zinc-800">
      <Text c="dimmed" size="xs">
        {label}
      </Text>
      <Text fw={600} mt={4} size="sm">
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
