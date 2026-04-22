import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { createProvider } from "react-easy-provider";
import { toast } from "sonner";
import { useAppProvider } from "~/components/layout/AppProvider";
import { useProjectOne } from "~/components/project/ProjectOneProvider";
import {
  createModelTrainLog,
  ModelTrainLogDatasetSnapshot,
  ModelTrainLogEvent,
  ModelTrainLogSummary,
  syncModelTrainLogProgress,
  updateModelTrainLogStatus,
  upsertProjectModel,
} from "~/lib/db/domain/models";
import { t } from "~/lib/i18n";
import { MOBILENET_ALPHA, MOBILENET_VERSION } from "~/lib/ml/mobilenet/model";
import { trainProjectMobilenetModel } from "~/lib/ml/mobilenet/project-train";
import { colorFromString } from "~/lib/project/class-color";
import { parseClassSettings } from "~/lib/project/class-settings";
import { resolveSampleFilePath } from "~/lib/project/sample-path";

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

type PreviewSplitClass = {
  classId: string
  className: string
  trainSampleIds: string[]
  trainSamples: number
  totalSamples: number
  validationSampleIds: string[]
  validationSamples: number
}

type FixedTimelineStepId =
  | "setup"
  | "data"
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

const TRAIN_LOG_FLUSH_DELAY_MS = 800

const FIXED_TIMELINE_STEP_ORDER: FixedTimelineStepId[] = [
  "setup",
  "data",
  "embeddings",
  "head",
  "training",
  "saving",
]

function getTimelineStepLabels(): Record<FixedTimelineStepId, string> {
  return {
    setup: t("project.train.timeline.setup"),
    data: t("project.train.timeline.data"),
    embeddings: t("project.train.timeline.embeddings"),
    head: t("project.train.timeline.head"),
    training: t("project.train.timeline.training"),
    saving: t("project.train.timeline.saving"),
  }
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
  if (id === "setup") {
    return `WebGL · MobileNet v${MOBILENET_VERSION} alpha ${MOBILENET_ALPHA}`
  }

  if (id === "data") {
    const trainSamples = context?.trainSamples ?? 0
    const validationSamples = context?.validationSamples ?? 0
    const total = trainSamples + validationSamples

    if (total > 0) {
      return `${total} images · ${trainSamples} train, ${validationSamples} val`
    }

    return null
  }

  if (id === "embeddings") {
    return t("project.train.timeline.detail.embeddings")
  }

  if (id === "head") {
    return t("project.train.timeline.detail.head")
  }

  if (id === "training") {
    const latestEpochNumber = context?.latestEpochNumber ?? 0
    const plannedEpochs = context?.plannedEpochs ?? 0

    if (latestEpochNumber > 0 && plannedEpochs > 0) {
      return t("project.train.timeline.detail.trainingProgress", {
        params: { current: latestEpochNumber, total: plannedEpochs },
      })
    }

    return t("project.train.timeline.detail.trainingDefault")
  }

  return t("project.train.timeline.detail.saving")
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

function createDeterministicSampleOrder(sample: {
  fileName: string
  id: string
  originalFileName: string | null
}) {
  return `${sample.id}:${sample.fileName}:${sample.originalFileName ?? ""}`
}

function createPreviewSplitSnapshot({
  classes,
  validationSplit,
}: {
  classes: ReturnType<typeof useProjectOne>["classes"]
  validationSplit: number
}): ModelTrainLogDatasetSnapshot {
  const samplesPerClass: PreviewSplitClass[] = classes.map((projectClass) => {
    const orderedSamples = [...projectClass.samples].sort((left, right) =>
      createDeterministicSampleOrder(left).localeCompare(
        createDeterministicSampleOrder(right),
      ),
    )

    if (orderedSamples.length === 0) {
      return {
        classId: projectClass.id,
        className: projectClass.name,
        trainSampleIds: [],
        trainSamples: 0,
        totalSamples: 0,
        validationSampleIds: [],
        validationSamples: 0,
      }
    }

    const rawValidationCount = Math.round(
      orderedSamples.length * validationSplit,
    )
    const validationCount = Math.min(
      Math.max(1, rawValidationCount),
      Math.max(orderedSamples.length - 1, 1),
    )
    const trainSamples = orderedSamples.slice(
      0,
      orderedSamples.length - validationCount,
    )
    const validationSamples = orderedSamples.slice(
      orderedSamples.length - validationCount,
    )

    return {
      classId: projectClass.id,
      className: projectClass.name,
      trainSampleIds: trainSamples.map((sample) => sample.id),
      trainSamples: trainSamples.length,
      totalSamples: orderedSamples.length,
      validationSampleIds: validationSamples.map((sample) => sample.id),
      validationSamples: validationSamples.length,
    }
  })

  return {
    classCount: classes.length,
    totalSamples: classes.reduce((sum, item) => sum + item.samples.length, 0),
    trainSamples: samplesPerClass.reduce(
      (sum, item) => sum + item.trainSamples,
      0,
    ),
    validationSamples: samplesPerClass.reduce(
      (sum, item) => sum + item.validationSamples,
      0,
    ),
    samplesPerClass,
  }
}

function getTimelineStepIdFromEvent(
  event: ModelTrainLogEvent,
): FixedTimelineStepId | null {
  if (event.type === "split") {
    return "data"
  }

  if (event.type === "epoch") {
    return "training"
  }

  const message = event.message.toLowerCase()

  if (message.includes("tensorflow.js") || message.includes("mobilenet")) {
    return "setup"
  }

  if (
    message.includes("training images") ||
    message.includes("local samples")
  ) {
    return "data"
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
    const total = event.trainSamples + event.validationSamples
    return `${total} images · ${event.trainSamples} train, ${event.validationSamples} val`
  }

  if (event.type === "epoch") {
    return `${latestEpochNumber}/${plannedEpochs} epochs`
  }

  const message = event.message.toLowerCase()

  if (message.includes("tensorflow.js")) {
    const backend = event.meta?.backend
    return typeof backend === "string" ? backend : null
  }

  if (message.includes("mobilenet")) {
    const version = event.meta?.version ?? MOBILENET_VERSION
    const alpha = event.meta?.alpha ?? MOBILENET_ALPHA
    return `MobileNet v${String(version)} alpha ${String(alpha)}`
  }

  if (message.includes("embedding")) {
    const inputShape = event.meta?.inputShape
    return typeof inputShape === "string"
      ? `1280-d vectors · ${inputShape}`
      : "1280-d feature vectors"
  }

  if (message.includes("classifier head")) {
    const learningRate = event.meta?.learningRate
    return learningRate != null
      ? `Dense classifier · lr ${String(learningRate)}`
      : "Dense classifier"
  }

  if (message.includes("model saved")) {
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
  savingArtifactPath,
  stepLabels,
}: {
  displayedTrainLog:
    | ActiveTrainSession
    | ReturnType<typeof useProjectOne>["latestTrainLog"]
  latestEpoch: Extract<ModelTrainLogEvent, { type: "epoch" }> | null
  latestEpochNumber: number
  now: number
  plannedEpochs: number
  savingArtifactPath: string | null
  stepLabels: Record<FixedTimelineStepId, string>
}): FixedTimelineStep[] {
  const fallbackSteps = FIXED_TIMELINE_STEP_ORDER.map((id) => ({
    detail:
      id === "setup"
        ? `WebGL · MobileNet v${MOBILENET_VERSION} alpha ${MOBILENET_ALPHA}`
        : null,
    elapsedLabel: null,
    id,
    label: stepLabels[id],
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

  // Enrich saving step: use "Model saved" event directly (bypasses first-occurrence-wins)
  const modelSavedEvent = displayedTrainLog.events.find(
    (e) =>
      e.type === "phase" && e.message.toLowerCase().includes("model saved"),
  )
  if (modelSavedEvent?.type === "phase") {
    const artifactPath =
      typeof modelSavedEvent.meta?.artifactPath === "string"
        ? modelSavedEvent.meta.artifactPath
        : null
    milestoneMap.set("saving", {
      at: milestoneMap.get("saving")?.at ?? modelSavedEvent.at,
      detail: artifactPath,
    })
  } else if (displayedTrainLog.status === "completed" && savingArtifactPath) {
    // Fallback when "Model saved" event wasn't persisted to DB but training completed
    milestoneMap.set("saving", {
      at: displayedTrainLog.endedAt ?? new Date(now).toISOString(),
      detail: savingArtifactPath,
    })
  }

  // Enrich setup step: combine backend (from tfjs event) + MobileNet info (from mobilenet event)
  if (milestoneMap.has("setup")) {
    const mobilenetEvent = displayedTrainLog.events.find(
      (e) =>
        e.type === "phase" && e.message.toLowerCase().includes("mobilenet"),
    )
    if (mobilenetEvent) {
      const mbnMeta = (mobilenetEvent as any).meta as any
      const version = mbnMeta?.version ?? MOBILENET_VERSION
      const alpha = mbnMeta?.alpha ?? MOBILENET_ALPHA
      const mobilenetDetail = `MobileNet v${String(version)} alpha ${String(alpha)}`
      const existing = milestoneMap.get("setup")!
      milestoneMap.set("setup", {
        ...existing,
        detail: existing.detail
          ? `${existing.detail} · ${mobilenetDetail}`
          : mobilenetDetail,
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

    if (displayedTrainLog.status === "completed") {
      status = "completed"
    } else if (milestone) {
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
      label: stepLabels[id],
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
  const { t, locale } = useAppProvider()
  const [activeSession, setActiveSession] = useState<ActiveTrainSession | null>(
    null,
  )
  const [logDetailsOpened, setLogDetailsOpened] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [inspectDataOpened, setInspectDataOpened] = useState(false)
  const [trainDataView, setTrainDataView] = useState<TrainDataView>("train")
  const [trainSettingsOpened, setTrainSettingsOpened] = useState(false)
  const activeSessionRef = useRef<ActiveTrainSession | null>(null)
  const activeTrainLogIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const trainDbWriteQueueRef = useRef<Promise<void>>(Promise.resolve())
  const trainLogFlushTimerRef = useRef<number | null>(null)
  const isTrainLogDirtyRef = useRef(false)
  const isTrainLogFlushInFlightRef = useRef(false)

  function enqueueTrainDbWrite(task: () => Promise<void>) {
    const nextTask = trainDbWriteQueueRef.current.then(task, task)
    trainDbWriteQueueRef.current = nextTask.catch(() => {})
    return nextTask
  }

  async function flushTrainDbWrites() {
    await trainDbWriteQueueRef.current
  }

  function clearTrainLogFlushTimer() {
    if (trainLogFlushTimerRef.current == null) {
      return
    }

    window.clearTimeout(trainLogFlushTimerRef.current)
    trainLogFlushTimerRef.current = null
  }

  function setActiveTrainSession(nextSession: ActiveTrainSession | null) {
    activeSessionRef.current = nextSession
    setActiveSession(nextSession)
  }

  function updateActiveTrainSession(
    updater: (current: ActiveTrainSession) => ActiveTrainSession,
  ) {
    setActiveSession((current) => {
      if (!current) {
        activeSessionRef.current = current
        return current
      }

      const nextSession = updater(current)
      activeSessionRef.current = nextSession
      return nextSession
    })
  }

  async function flushBufferedTrainLog() {
    clearTrainLogFlushTimer()

    const currentSession = activeSessionRef.current
    const trainLogId = activeTrainLogIdRef.current

    if (
      !currentSession ||
      !trainLogId ||
      !isTrainLogDirtyRef.current ||
      isTrainLogFlushInFlightRef.current
    ) {
      return
    }

    isTrainLogDirtyRef.current = false
    isTrainLogFlushInFlightRef.current = true

    try {
      await enqueueTrainDbWrite(() =>
        syncModelTrainLogProgress({
          datasetSnapshot: currentSession.datasetSnapshot,
          events: currentSession.events,
          trainLogId,
        }),
      )
      await flushTrainDbWrites()
    } finally {
      isTrainLogFlushInFlightRef.current = false

      if (isTrainLogDirtyRef.current) {
        scheduleTrainLogFlush()
      }
    }
  }

  function scheduleTrainLogFlush(delay = TRAIN_LOG_FLUSH_DELAY_MS) {
    if (trainLogFlushTimerRef.current != null) {
      return
    }

    trainLogFlushTimerRef.current = window.setTimeout(() => {
      trainLogFlushTimerRef.current = null
      void flushBufferedTrainLog()
    }, delay)
  }

  function markTrainLogDirty() {
    isTrainLogDirtyRef.current = true
    scheduleTrainLogFlush()
  }

  async function flushBufferedTrainLogNow() {
    clearTrainLogFlushTimer()

    while (isTrainLogDirtyRef.current || isTrainLogFlushInFlightRef.current) {
      if (isTrainLogFlushInFlightRef.current) {
        await flushTrainDbWrites()
        continue
      }

      await flushBufferedTrainLog()
    }
  }

  useEffect(
    () => () => {
      clearTrainLogFlushTimer()
    },
    [],
  )

  const trainMutation = useMutation({
    mutationFn: async () => {
      trainDbWriteQueueRef.current = Promise.resolve()
      clearTrainLogFlushTimer()
      isTrainLogDirtyRef.current = false
      isTrainLogFlushInFlightRef.current = false
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

      setActiveTrainSession({
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
            filePath: resolveSampleFilePath(
              projectSettings.samplePathPattern,
              sample.projectId,
              sample.classId,
              sample.fileName,
            ),
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
          }

          updateActiveTrainSession((current) => ({
            ...current,
            datasetSnapshot:
              event.type === "split"
                ? latestDatasetSnapshot
                : current.datasetSnapshot,
            events: [...current.events, event],
            summary:
              event.type === "epoch"
                ? {
                    accuracy: event.acc ?? current.summary?.accuracy ?? null,
                    durationMs: current.summary?.durationMs ?? null,
                    endedAt: current.summary?.endedAt ?? "",
                    loss: event.loss,
                    validationAccuracy:
                      event.valAcc ??
                      current.summary?.validationAccuracy ??
                      null,
                    validationLoss:
                      event.valLoss ?? current.summary?.validationLoss ?? null,
                  }
                : current.summary,
          }))
          markTrainLogDirty()
        },
        projectId,
        signal: abortController.signal,
        validationSplit: trainSettings.validationSplit,
      })

      latestDatasetSnapshot = result.datasetSnapshot
      updateActiveTrainSession((current) => ({
        ...current,
        datasetSnapshot: result.datasetSnapshot,
      }))
      markTrainLogDirty()
      await flushBufferedTrainLogNow()

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

      updateActiveTrainSession((current) => ({
        ...current,
        datasetSnapshot: result.datasetSnapshot,
        endedAt: summary.endedAt,
        status: "completed",
        summary,
      }))

      await enqueueTrainDbWrite(() =>
        updateModelTrainLogStatus({
          modelId,
          status: "completed",
          summary,
          trainLogId,
        }),
      )
      await flushTrainDbWrites()
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
        updateActiveTrainSession((current) => ({
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
        }))
        markTrainLogDirty()
        await flushBufferedTrainLogNow()
        await enqueueTrainDbWrite(() =>
          updateModelTrainLogStatus({
            status: isCancelled ? "cancelled" : "failed",
            summary,
            trainLogId: activeTrainLogIdRef.current!,
          }),
        )
        await flushTrainDbWrites()
      }

      activeTrainLogIdRef.current = null
      abortControllerRef.current = null
      clearTrainLogFlushTimer()
      isTrainLogDirtyRef.current = false
      isTrainLogFlushInFlightRef.current = false
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["project-model", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
      ])
      if (isCancelled) {
        toast.message(t("project.train.toast.cancelled"))
      } else {
        toast.error(errorMessage, {
          description: errorDescription ?? undefined,
        })
      }
    },
    onSuccess: async () => {
      activeTrainLogIdRef.current = null
      abortControllerRef.current = null
      clearTrainLogFlushTimer()
      isTrainLogDirtyRef.current = false
      isTrainLogFlushInFlightRef.current = false
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["project-model", projectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project-train-log", projectId],
        }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ])
      toast.success(t("project.train.toast.completed"), {
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
  const previewSplitSnapshot = useMemo(
    () =>
      createPreviewSplitSnapshot({
        classes,
        validationSplit: trainSettings.validationSplit,
      }),
    [classes, trainSettings.validationSplit],
  )
  const inspectedDataSnapshot =
    displayedTrainLog?.datasetSnapshot ?? previewSplitSnapshot
  const displayedSplitSamples = useMemo(() => {
    const sampleIds = inspectedDataSnapshot.samplesPerClass.flatMap((item) =>
      trainDataView === "train"
        ? (item.trainSampleIds ?? [])
        : (item.validationSampleIds ?? []),
    )

    return sampleIds
      .map((sampleId) => sampleMap.get(sampleId) ?? null)
      .filter((sample): sample is NonNullable<typeof sample> => sample != null)
  }, [inspectedDataSnapshot, sampleMap, trainDataView])
  const timelineSteps = useMemo(
    () =>
      buildFixedTimelineSteps({
        displayedTrainLog,
        latestEpoch,
        latestEpochNumber,
        now,
        plannedEpochs,
        savingArtifactPath: projectModel?.artifactPath ?? null,
        stepLabels: getTimelineStepLabels(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      displayedTrainLog,
      latestEpoch,
      latestEpochNumber,
      now,
      plannedEpochs,
      locale,
      projectModel?.artifactPath,
    ],
  )
  const hasTrainData =
    inspectedDataSnapshot.trainSamples > 0 ||
    inspectedDataSnapshot.validationSamples > 0
  const splitClassIndexMap = useMemo(
    () =>
      Object.fromEntries(
        inspectedDataSnapshot.samplesPerClass.map((item, i) => [
          item.classId,
          i,
        ]),
      ),
    [inspectedDataSnapshot],
  )
  const splitClassColorMap = useMemo(
    () =>
      Object.fromEntries(
        classes.map((cls) => [
          cls.id,
          parseClassSettings(cls.settings).classColor ??
            colorFromString(cls.id),
        ]),
      ),
    [classes],
  )
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
    splitClassColorMap,
    splitClassIndexMap,
    inspectDataOpened,
    inspectedDataSnapshot,
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
    setInspectDataOpened,
    openTrainDataDrawer: () => {
      setTrainDataView("train")
      setInspectDataOpened(true)
    },
    openValidationDataDrawer: () => {
      setTrainDataView("validation")
      setInspectDataOpened(true)
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
        label: t("project.train.metrics.modelAccuracy"),
        value: formatMetric(
          latestEpoch?.acc ??
            displayedTrainLog?.summary?.accuracy ??
            projectModel?.accuracy,
        ),
      },
      {
        label: t("project.train.metrics.loss"),
        value: formatMetric(
          latestEpoch?.loss ?? displayedTrainLog?.summary?.loss,
        ),
      },
      {
        label: t("project.train.metrics.valLoss"),
        value: formatMetric(
          latestEpoch?.valLoss ?? displayedTrainLog?.summary?.validationLoss,
        ),
      },
      {
        label: t("project.train.metrics.valAcc"),
        value: formatMetric(
          latestEpoch?.valAcc ?? displayedTrainLog?.summary?.validationAccuracy,
        ),
      },
    ],
    timelineSteps,
    trainDataView,
    trainDataViewOptions: [
      {
        label: `${t("project.train.dataset.trainImages")} (${inspectedDataSnapshot.trainSamples})`,
        value: "train",
      },
      {
        label: `${t("project.train.dataset.validation")} (${inspectedDataSnapshot.validationSamples})`,
        value: "validation",
      },
    ],
    trainProgressPercent: Math.round(trainProgress * 100),
    trainSettingsOpened,
    validationSplitLabel: `${Math.round(trainSettings.validationSplit * 100)}%`,
    trainStatusText: displayedTrainLog
      ? displayedTrainLog.status === "started"
        ? t("project.train.status.inProgress")
        : displayedTrainLog.status === "cancelled"
          ? t("project.train.status.cancelled")
          : t("project.train.status.lastStatus", {
              params: { status: displayedTrainLog.status },
            })
      : t("project.train.status.notStarted"),
  }
})
