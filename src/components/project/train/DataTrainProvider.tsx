import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { createProvider } from "react-easy-provider"
import { toast } from "sonner"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import {
  appendModelTrainLogEvent,
  createModelTrainLog,
  ModelTrainLogDatasetSnapshot,
  ModelTrainLogEvent,
  ModelTrainLogSummary,
  updateModelTrainLogDatasetSnapshot,
  updateModelTrainLogStatus,
  upsertProjectModel,
} from "~/lib/db/domain/models"
import { MOBILENET_ALPHA, MOBILENET_VERSION } from "~/lib/ml/mobilenet/model"
import { trainProjectMobilenetModel } from "~/lib/ml/mobilenet/project-train"

type ActiveTrainSession = {
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  endedAt: string | null
  events: ModelTrainLogEvent[]
  settingsSnapshot: string
  startedAt: string
  status: "started" | "completed" | "failed" | "cancelled"
  summary: ModelTrainLogSummary | null
  trainLogId: string
}

type TrainDataView = "train" | "validation"

type FixedTimelineStepId =
  | "tfjs"
  | "mobilenet"
  | "split"
  | "samples"
  | "embeddings"
  | "head"
  | "training"
  | "saving"

type FixedTimelineStep = {
  detail: string | null
  elapsedLabel: string | null
  id: FixedTimelineStepId
  label: string
  status: "completed" | "failed" | "in_progress" | "pending"
}

const FIXED_TIMELINE_STEP_ORDER: FixedTimelineStepId[] = [
  "tfjs",
  "mobilenet",
  "split",
  "samples",
  "embeddings",
  "head",
  "training",
  "saving",
]

const FIXED_TIMELINE_STEP_LABELS: Record<FixedTimelineStepId, string> = {
  tfjs: "TensorFlow.js",
  mobilenet: "MobileNet",
  split: "Train / Validation Split",
  samples: "Local Samples",
  embeddings: "Embeddings",
  head: "Classifier Head",
  training: "Training",
  saving: "Saving Model",
}

function getDefaultStepDetail(
  id: FixedTimelineStepId,
  context?: {
    latestEpochNumber?: number
    plannedEpochs?: number
    trainSamples?: number
    validationSamples?: number
  },
) {
  if (id === "tfjs") {
    return "Initialize runtime and select the execution backend."
  }

  if (id === "mobilenet") {
    return `Load pretrained backbone v${MOBILENET_VERSION} alpha ${MOBILENET_ALPHA}.`
  }

  if (id === "split") {
    return "Split each class into train and validation sets automatically."
  }

  if (id === "samples") {
    const trainSamples = context?.trainSamples ?? 0
    const validationSamples = context?.validationSamples ?? 0
    const totalSamples = trainSamples + validationSamples

    if (totalSamples > 0) {
      return `${totalSamples} images loaded`
    }

    return "Images loaded"
  }

  if (id === "embeddings") {
    return "Convert images into 1280-d MobileNet feature vectors."
  }

  if (id === "head") {
    return "Create a small dense classifier on top of the extracted features."
  }

  if (id === "training") {
    const latestEpochNumber = context?.latestEpochNumber ?? 0
    const plannedEpochs = context?.plannedEpochs ?? 0

    if (latestEpochNumber > 0 && plannedEpochs > 0) {
      return `Optimize the classifier head for ${latestEpochNumber}/${plannedEpochs} epochs.`
    }

    return "Optimize the classifier head on top of frozen MobileNet features."
  }

  return "Write the trained model artifacts to the project workspace."
}

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === "string" && error.trim()) {
    return error.trim()
  }

  return "Training failed unexpectedly."
}

function getErrorDescription(error: unknown) {
  if (!(error instanceof Error)) {
    return null
  }

  const details: string[] = []

  if ("cause" in error && error.cause != null) {
    const causeMessage = getErrorMessage(error.cause)

    if (causeMessage && causeMessage !== error.message) {
      details.push(causeMessage)
    }
  }

  if (typeof error.stack === "string") {
    const stackLines = error.stack
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(1, 3)

    if (stackLines.length > 0) {
      details.push(stackLines.join(" | "))
    }
  }

  return details.length > 0 ? details.join("\n") : null
}

function renderEventMessage(event: ModelTrainLogEvent) {
  if (event.type === "phase") {
    const metaEntries = Object.entries(event.meta ?? {}).filter(
      ([, value]) => value != null && value !== "",
    )

    if (metaEntries.length === 0) {
      return event.message
    }

    const details = metaEntries
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" ")

    return `${event.message} ${details}`
  }

  if (event.type === "split") {
    return `Split dataset: ${event.trainSamples} train / ${event.validationSamples} validation`
  }

  const acc = event.acc != null ? ` acc ${event.acc.toFixed(3)}` : ""
  const valAcc =
    event.valAcc != null ? ` val_acc ${event.valAcc.toFixed(3)}` : ""
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

function getTimelineStepIdFromEvent(
  event: ModelTrainLogEvent,
): FixedTimelineStepId | null {
  if (event.type === "split") {
    return "split"
  }

  if (event.type === "epoch") {
    return "training"
  }

  const message = event.message.toLowerCase()

  if (message.includes("tensorflow.js")) {
    return "tfjs"
  }

  if (message.includes("mobilenet")) {
    return "mobilenet"
  }

  if (
    message.includes("training images") ||
    message.includes("local samples")
  ) {
    return "samples"
  }

  if (message.includes("embedding")) {
    return "embeddings"
  }

  if (message.includes("classifier head")) {
    return "head"
  }

  if (message.includes("saving") || message.includes("model saved")) {
    return "saving"
  }

  if (message.includes("training classifier")) {
    return "training"
  }

  return null
}

function getTimelineStepDetail({
  event,
  latestEpochNumber,
  plannedEpochs,
}: {
  event: ModelTrainLogEvent
  latestEpochNumber: number
  plannedEpochs: number
}) {
  if (event.type === "split") {
    return `${event.trainSamples} train / ${event.validationSamples} validation`
  }

  if (event.type === "epoch") {
    return `${latestEpochNumber}/${plannedEpochs} epochs`
  }

  if (event.message.toLowerCase().includes("tensorflow.js")) {
    const backend = event.meta?.backend
    return typeof backend === "string" ? backend : null
  }

  if (event.message.toLowerCase().includes("mobilenet")) {
    const version = event.meta?.version
    const alpha = event.meta?.alpha

    if (version != null && alpha != null) {
      return `v${String(version)} alpha ${String(alpha)}`
    }

    return `v${MOBILENET_VERSION} alpha ${MOBILENET_ALPHA}`
  }

  if (event.message.toLowerCase().includes("embedding")) {
    const inputShape = event.meta?.inputShape
    return typeof inputShape === "string" ? inputShape : null
  }

  if (event.message.toLowerCase().includes("classifier head")) {
    const learningRate = event.meta?.learningRate
    return learningRate != null ? `lr ${String(learningRate)}` : null
  }

  if (event.message.toLowerCase().includes("model saved")) {
    const artifactPath = event.meta?.artifactPath
    return typeof artifactPath === "string" ? artifactPath : null
  }

  return null
}

function buildFixedTimelineSteps({
  displayedTrainLog,
  latestEpoch,
  latestEpochNumber,
  now,
  plannedEpochs,
}: {
  displayedTrainLog:
    | ActiveTrainSession
    | ReturnType<typeof useProjectOne>["latestTrainLog"]
  latestEpoch: Extract<ModelTrainLogEvent, { type: "epoch" }> | null
  latestEpochNumber: number
  now: number
  plannedEpochs: number
}): FixedTimelineStep[] {
  const fallbackSteps = FIXED_TIMELINE_STEP_ORDER.map((id) => ({
    detail:
      id === "mobilenet"
        ? `v${MOBILENET_VERSION} alpha ${MOBILENET_ALPHA}`
        : null,
    elapsedLabel: null,
    id,
    label: FIXED_TIMELINE_STEP_LABELS[id],
    status: "pending" as const,
  }))

  if (!displayedTrainLog) {
    return fallbackSteps
  }

  const milestoneMap = new Map<
    FixedTimelineStepId,
    {
      at: string
      detail: string | null
    }
  >()

  for (const event of displayedTrainLog.events) {
    const stepId = getTimelineStepIdFromEvent(event)

    if (!stepId) {
      continue
    }

    if (!milestoneMap.has(stepId)) {
      milestoneMap.set(stepId, {
        at: event.at,
        detail: getTimelineStepDetail({
          event,
          latestEpochNumber,
          plannedEpochs,
        }),
      })
    }
  }

  if (latestEpoch && milestoneMap.has("training")) {
    const currentTrainingStep = milestoneMap.get("training")

    if (currentTrainingStep) {
      milestoneMap.set("training", {
        ...currentTrainingStep,
        detail: `${latestEpochNumber}/${plannedEpochs} epochs`,
      })
    }
  }

  const reachedStepIds = FIXED_TIMELINE_STEP_ORDER.filter((id) =>
    milestoneMap.has(id),
  )
  const lastReachedStepId =
    reachedStepIds.length > 0 ? reachedStepIds[reachedStepIds.length - 1] : null
  const endTime = displayedTrainLog.endedAt ?? new Date(now).toISOString()

  return FIXED_TIMELINE_STEP_ORDER.map((id, index) => {
    const milestone = milestoneMap.get(id)
    const nextReachedStepId = FIXED_TIMELINE_STEP_ORDER.slice(index + 1).find(
      (stepId) => milestoneMap.has(stepId),
    )
    const nextMilestone = nextReachedStepId
      ? milestoneMap.get(nextReachedStepId)
      : null

    let status: FixedTimelineStep["status"] = "pending"

    if (milestone) {
      const isLastReached = id === lastReachedStepId

      if (displayedTrainLog.status === "failed" && isLastReached) {
        status = "failed"
      } else if (displayedTrainLog.status === "cancelled" && isLastReached) {
        status = "failed"
      } else if (displayedTrainLog.status === "started" && isLastReached) {
        status = "in_progress"
      } else {
        status = "completed"
      }
    }

    const elapsedMs =
      milestone != null
        ? Math.max(
            new Date(nextMilestone?.at ?? endTime).getTime() -
              new Date(milestone.at).getTime(),
            0,
          )
        : null

    return {
      detail:
        milestone?.detail ??
        getDefaultStepDetail(id, {
          latestEpochNumber,
          plannedEpochs,
          trainSamples: displayedTrainLog.datasetSnapshot.trainSamples,
          validationSamples:
            displayedTrainLog.datasetSnapshot.validationSamples,
        }),
      elapsedLabel: elapsedMs != null ? formatDuration(elapsedMs) : null,
      id,
      label: FIXED_TIMELINE_STEP_LABELS[id],
      status,
    }
  })
}

export const [useDataTrain, DataTrainProvider] = createProvider(() => {
  const {
    applyTrainSettings,
    classes,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    isReadyForTrain,
    latestTrainLog,
    projectId,
    projectModel,
    projectSettings,
    trainSettings,
  } = useProjectOne()
  const queryClient = useQueryClient()
  const [activeSession, setActiveSession] = useState<ActiveTrainSession | null>(
    null,
  )
  const [logDetailsOpened, setLogDetailsOpened] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [trainDataView, setTrainDataView] = useState<TrainDataView>("train")
  const [trainSettingsOpened, setTrainSettingsOpened] = useState(false)
  const activeTrainLogIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const trainMutation = useMutation({
    mutationFn: async () => {
      const abortController = new AbortController()
      abortControllerRef.current = abortController
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
                  summary:
                    event.type === "epoch"
                      ? {
                          accuracy:
                            event.acc ?? current.summary?.accuracy ?? null,
                          durationMs: current.summary?.durationMs ?? null,
                          endedAt: current.summary?.endedAt ?? "",
                          loss: event.loss,
                          validationAccuracy:
                            event.valAcc ??
                            current.summary?.validationAccuracy ??
                            null,
                          validationLoss:
                            event.valLoss ??
                            current.summary?.validationLoss ??
                            null,
                        }
                      : current.summary,
                }
              : current,
          )
        },
        projectId,
        signal: abortController.signal,
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
    },
    onError: async (error) => {
      const isCancelled =
        error instanceof Error && error.message === "Training cancelled."
      const errorMessage = getErrorMessage(error)
      const errorDescription = getErrorDescription(error)
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
          message: errorMessage,
          type: "phase",
        })
        await updateModelTrainLogStatus({
          status: isCancelled ? "cancelled" : "failed",
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
                  message: errorMessage,
                  type: "phase",
                },
              ],
              status: isCancelled ? "cancelled" : "failed",
              summary,
            }
          : current,
      )
      activeTrainLogIdRef.current = null
      abortControllerRef.current = null
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["project-model", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
      ])
      if (isCancelled) {
        toast.message("Training cancelled.")
      } else {
        toast.error(errorMessage, {
          description: errorDescription ?? undefined,
        })
      }
    },
    onSuccess: async () => {
      activeTrainLogIdRef.current = null
      abortControllerRef.current = null
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["project-model", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ])
      toast.success("Training completed.", {
        position: "top-center",
      })
    },
  })

  const displayedTrainLog = activeSession ?? latestTrainLog
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
    () =>
      displayedTrainLog?.events.filter((event) => event.type === "epoch") ?? [],
    [displayedTrainLog?.events],
  )
  const latestEpoch =
    epochEvents.length > 0 ? epochEvents[epochEvents.length - 1] : null
  const latestEpochNumber = latestEpoch?.epoch ?? 0
  const plannedEpochs =
    runSettings?.epochs && Number.isFinite(runSettings.epochs)
      ? Math.max(1, runSettings.epochs)
      : trainSettings.epochs
  const trainProgress = displayedTrainLog
    ? displayedTrainLog.status === "completed"
      ? 1
      : Math.min(latestEpochNumber / plannedEpochs, 1)
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
  const timelineSteps = useMemo(
    () =>
      buildFixedTimelineSteps({
        displayedTrainLog,
        latestEpoch,
        latestEpochNumber,
        now,
        plannedEpochs,
      }),
    [displayedTrainLog, latestEpoch, latestEpochNumber, now, plannedEpochs],
  )
  const hasTrainData =
    (displayedTrainLog?.datasetSnapshot.trainSamples ?? 0) > 0 ||
    (displayedTrainLog?.datasetSnapshot.validationSamples ?? 0) > 0
  const logEntries =
    displayedTrainLog?.events.map((event, index) => ({
      key: `${event.at}-${index}`,
      message: renderEventMessage(event),
      timeLabel: new Date(event.at).toLocaleTimeString(),
    })) ?? []

  return {
    applyTrainSettings,
    displayedSplitSamples,
    displayedTrainLog,
    elapsedLabel: displayedTrainLog ? formatDuration(elapsedMs) : null,
    formatMetric,
    getTrainSettingsFormValues,
    hasTrainData,
    isApplyingTrainSettings,
    isReadyForTrain,
    isTraining: trainMutation.isPending,
    isTrainingCancelled: displayedTrainLog?.status === "cancelled",
    latestEpochNumber,
    logDetailsOpened,
    logEntries,
    openLogDetails: () => {
      setLogDetailsOpened(true)
    },
    closeLogDetails: () => {
      setLogDetailsOpened(false)
    },
    plannedEpochs,
    projectId,
    projectModel,
    requestStopTraining: () => {
      abortControllerRef.current?.abort(new Error("Training cancelled."))
    },
    setTrainDataView: (value: TrainDataView) => {
      setTrainDataView(value)
    },
    setTrainSettingsOpened,
    startTraining: async () => {
      await trainMutation.mutateAsync()
    },
    summaryStats: [
      {
        label: "Model Accuracy",
        value: formatMetric(
          latestEpoch?.acc ??
            displayedTrainLog?.summary?.accuracy ??
            projectModel?.accuracy,
        ),
      },
      {
        label: "Loss",
        value: formatMetric(
          latestEpoch?.loss ?? displayedTrainLog?.summary?.loss,
        ),
      },
      {
        label: "Val Loss",
        value: formatMetric(
          latestEpoch?.valLoss ?? displayedTrainLog?.summary?.validationLoss,
        ),
      },
      {
        label: "Val Acc",
        value: formatMetric(
          latestEpoch?.valAcc ?? displayedTrainLog?.summary?.validationAccuracy,
        ),
      },
    ],
    timelineSteps,
    trainDataView,
    trainDataViewOptions: displayedTrainLog
      ? [
          {
            label: `Train (${displayedTrainLog.datasetSnapshot.trainSamples})`,
            value: "train",
          },
          {
            label: `Validation (${displayedTrainLog.datasetSnapshot.validationSamples})`,
            value: "validation",
          },
        ]
      : [],
    trainProgressPercent: Math.round(trainProgress * 100),
    trainSettingsOpened,
    trainStatusText: displayedTrainLog
      ? displayedTrainLog.status === "started"
        ? "Training is in progress."
        : displayedTrainLog.status === "cancelled"
          ? "Last status: cancelled"
          : `Last status: ${displayedTrainLog.status}`
      : "Training has not started yet.",
  }
})
