import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs"
import type * as tf from "@tensorflow/tfjs"
import type {
  ModelTrainLogDatasetSnapshot,
  ModelTrainLogEvent,
} from "~/lib/db/domain/models"
import { initTf } from "~/lib/ml/backend"
import { buildMobilenetEmbeddingDatasetFromGroups } from "~/lib/ml/mobilenet/dataset"
import {
  MOBILENET_ALPHA,
  MOBILENET_VERSION,
  createMobilenetClassifierHead,
  loadMobilenetModel,
} from "~/lib/ml/mobilenet/model"
import { saveMobilenetClassifierModel } from "~/lib/ml/mobilenet/storage"
import { trainMobilenetClassifier } from "~/lib/ml/mobilenet/train"
import { fileToImageTensor } from "~/lib/ml/sample/image"

type TrainableSample = {
  filePath: string
  id: string
  originalFileName: string | null
}

type TrainableClass = {
  id: string
  name: string
  samples: TrainableSample[]
}

type SplitClassResult = {
  allSamples: number
  classId: string
  className: string
  trainSamples: TrainableSample[]
  validationSamples: TrainableSample[]
}

function createDeterministicOrder(sample: TrainableSample) {
  return `${sample.id}:${sample.filePath}:${sample.originalFileName ?? ""}`
}

function splitClassSamples(
  trainableClass: TrainableClass,
  validationSplit: number,
): SplitClassResult {
  const orderedSamples = [...trainableClass.samples].sort((left, right) =>
    createDeterministicOrder(left).localeCompare(
      createDeterministicOrder(right),
    ),
  )
  const rawValidationCount = Math.round(orderedSamples.length * validationSplit)
  const validationCount = Math.min(
    Math.max(1, rawValidationCount),
    Math.max(orderedSamples.length - 1, 1),
  )

  return {
    classId: trainableClass.id,
    className: trainableClass.name,
    allSamples: orderedSamples.length,
    trainSamples: orderedSamples.slice(
      0,
      orderedSamples.length - validationCount,
    ),
    validationSamples: orderedSamples.slice(
      orderedSamples.length - validationCount,
    ),
  }
}

function guessMimeType(filePath: string) {
  const lower = filePath.toLowerCase()

  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".bmp")) return "image/bmp"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"

  return "application/octet-stream"
}

async function loadSampleAsFile(sample: TrainableSample) {
  const bytes = await readFile(sample.filePath, {
    baseDir: BaseDirectory.AppData,
  })

  const fileName =
    sample.originalFileName ??
    sample.filePath.split(/[\\/]/).pop() ??
    `${sample.id}.jpg`

  const type = guessMimeType(fileName)

  return new File([bytes], fileName, {
    type,
    lastModified: Date.now(),
  })
}

export type ProjectTrainDatasetSnapshot = ModelTrainLogDatasetSnapshot

export type ProjectTrainResult = {
  artifactPath: string
  datasetSnapshot: ProjectTrainDatasetSnapshot
  events: ModelTrainLogEvent[]
  inputShape: number[]
  summary: {
    accuracy: number | null
    durationMs: number
    loss: number | null
    validationAccuracy: number | null
    validationLoss: number | null
  }
}

type EpochMetricSnapshot = {
  acc?: number
  epoch: number
  loss: number
  valAcc?: number
  valLoss?: number
}

export async function trainProjectMobilenetModel({
  batchSize,
  classes,
  earlyStopping,
  earlyStoppingPatience,
  epochs,
  imageSize,
  learningRate,
  onEvent,
  projectId,
  signal,
  validationSplit,
}: {
  batchSize: number
  classes: TrainableClass[]
  earlyStopping: boolean
  earlyStoppingPatience: number
  epochs: number
  imageSize: number
  learningRate: number
  onEvent?: (event: ModelTrainLogEvent) => Promise<void> | void
  projectId: string
  signal?: AbortSignal
  validationSplit: number
}) {
  const events: ModelTrainLogEvent[] = []
  const startedAt = performance.now()
  let trainXs: tf.Tensor | null = null
  let trainYs: tf.Tensor | null = null
  let validationXs: tf.Tensor | null = null
  let validationYs: tf.Tensor | null = null
  let classifier: tf.LayersModel | null = null
  let lastEpochLog: EpochMetricSnapshot | null = null

  async function pushEvent(event: ModelTrainLogEvent) {
    events.push(event)
    await onEvent?.(event)
  }

  function throwIfAborted() {
    if (!signal?.aborted) {
      return
    }

    throw signal.reason instanceof Error
      ? signal.reason
      : new Error("Training cancelled.")
  }

  try {
    throwIfAborted()
    const tfState = await initTf()
    throwIfAborted()

    await pushEvent({
      at: new Date().toISOString(),
      message: "TensorFlow.js ready",
      meta: {
        backend: tfState.backend,
        initTimeMs: Math.round(tfState.initTimeMs),
      },
      type: "phase",
    })

    const embeddingModel = await loadMobilenetModel()
    throwIfAborted()

    await pushEvent({
      at: new Date().toISOString(),
      message: "MobileNet ready",
      meta: {
        alpha: MOBILENET_ALPHA,
        version: MOBILENET_VERSION,
      },
      type: "phase",
    })

    const splitResults = classes.map((trainableClass) =>
      splitClassSamples(trainableClass, validationSplit),
    )
    const datasetSnapshot: ProjectTrainDatasetSnapshot = {
      classCount: splitResults.length,
      totalSamples: splitResults.reduce(
        (sum, item) => sum + item.allSamples,
        0,
      ),
      trainSamples: splitResults.reduce(
        (sum, item) => sum + item.trainSamples.length,
        0,
      ),
      validationSamples: splitResults.reduce(
        (sum, item) => sum + item.validationSamples.length,
        0,
      ),
      samplesPerClass: splitResults.map((item) => ({
        classId: item.classId,
        className: item.className,
        trainSampleIds: item.trainSamples.map((sample) => sample.id),
        totalSamples: item.allSamples,
        trainSamples: item.trainSamples.length,
        validationSampleIds: item.validationSamples.map((sample) => sample.id),
        validationSamples: item.validationSamples.length,
      })),
    }

    await pushEvent({
      at: new Date().toISOString(),
      trainSamples: datasetSnapshot.trainSamples,
      type: "split",
      validationSamples: datasetSnapshot.validationSamples,
    })

    const trainGroups = await Promise.all(
      splitResults.map(async (item, labelIndex) => ({
        files: await Promise.all(
          item.trainSamples.map((sample) => loadSampleAsFile(sample)),
        ),
        labelIndex,
      })),
    )
    throwIfAborted()
    const validationGroups = await Promise.all(
      splitResults.map(async (item, labelIndex) => ({
        files: await Promise.all(
          item.validationSamples.map((sample) => loadSampleAsFile(sample)),
        ),
        labelIndex,
      })),
    )
    throwIfAborted()

    await pushEvent({
      at: new Date().toISOString(),
      message: "Local samples ready",
      meta: {
        trainSamples: datasetSnapshot.trainSamples,
        validationSamples: datasetSnapshot.validationSamples,
      },
      type: "phase",
    })

    const trainDataset = await buildMobilenetEmbeddingDatasetFromGroups({
      groups: trainGroups,
      embeddingModel,
      fileToTensor: fileToImageTensor,
      imageSize,
    })
    throwIfAborted()
    const validationDataset = await buildMobilenetEmbeddingDatasetFromGroups({
      groups: validationGroups,
      embeddingModel,
      fileToTensor: fileToImageTensor,
      imageSize,
    })
    throwIfAborted()

    trainXs = trainDataset.xs
    trainYs = trainDataset.ys
    validationXs = validationDataset.xs
    validationYs = validationDataset.ys

    await pushEvent({
      at: new Date().toISOString(),
      message: "Embeddings ready",
      meta: {
        inputShape: trainDataset.inputShape.join("x"),
        numClasses: trainDataset.numClasses,
      },
      type: "phase",
    })

    classifier = createMobilenetClassifierHead(
      trainDataset.inputShape,
      trainDataset.numClasses,
      { learningRate },
    )

    await pushEvent({
      at: new Date().toISOString(),
      message: "Classifier head ready",
      meta: {
        learningRate,
      },
      type: "phase",
    })

    const trainResult = await trainMobilenetClassifier({
      model: classifier,
      xs: trainXs,
      ys: trainYs,
      validationData: [validationXs, validationYs],
      earlyStopping,
      earlyStoppingPatience,
      epochs,
      batchSize: Math.min(batchSize, datasetSnapshot.trainSamples),
      signal,
      onEpochEnd: async (log) => {
        lastEpochLog = log
        await pushEvent({
          at: new Date().toISOString(),
          epoch: log.epoch,
          loss: log.loss,
          type: "epoch",
          acc: log.acc,
          valAcc: log.valAcc,
          valLoss: log.valLoss,
        })
      },
    })
    throwIfAborted()

    const artifactPath = `projects/${projectId}/model/latest`
    await saveMobilenetClassifierModel({
      directoryPath: artifactPath,
      imageSize,
      metadata: {
        classNames: classes.map((item) => item.name),
        inputShape: trainDataset.inputShape,
        mobilenetAlpha: MOBILENET_ALPHA,
        mobilenetVersion: MOBILENET_VERSION,
        numClasses: trainDataset.numClasses,
      },
      model: classifier,
    })
    throwIfAborted()

    await pushEvent({
      at: new Date().toISOString(),
      message: "Model saved",
      meta: {
        artifactPath,
      },
      type: "phase",
    })
    const durationMs = trainResult.trainTimeMs
    const finalEpochLog = lastEpochLog as EpochMetricSnapshot | null

    return {
      artifactPath,
      datasetSnapshot,
      events,
      inputShape: trainDataset.inputShape,
      summary: {
        accuracy: finalEpochLog?.acc ?? null,
        durationMs,
        loss: finalEpochLog?.loss ?? null,
        validationAccuracy: finalEpochLog?.valAcc ?? null,
        validationLoss: finalEpochLog?.valLoss ?? null,
      },
    } satisfies ProjectTrainResult
  } finally {
    classifier?.dispose()
    trainXs?.dispose()
    trainYs?.dispose()
    validationXs?.dispose()
    validationYs?.dispose()
    void startedAt
  }
}
