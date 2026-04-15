import type * as tf from "@tensorflow/tfjs"
import { initTf } from "~/lib/ml/backend"
import {
  buildMobilenetEmbeddingDatasetFromGroups,
} from "~/lib/ml/mobilenet/dataset"
import {
  MOBILENET_ALPHA,
  MOBILENET_VERSION,
  createMobilenetClassifierHead,
  loadMobilenetModel,
} from "~/lib/ml/mobilenet/model"
import { saveMobilenetClassifierModel } from "~/lib/ml/mobilenet/storage"
import { trainMobilenetClassifier } from "~/lib/ml/mobilenet/train"
import { fileToImageTensor } from "~/lib/ml/sample/image"
import type {
  ModelTrainLogDatasetSnapshot,
  ModelTrainLogEvent,
} from "~/lib/db/domain/models"
import { createSamplePreviewUrl } from "~/lib/project/sample-preview"

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
    createDeterministicOrder(left).localeCompare(createDeterministicOrder(right)),
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
    trainSamples: orderedSamples.slice(0, orderedSamples.length - validationCount),
    validationSamples: orderedSamples.slice(orderedSamples.length - validationCount),
  }
}

async function loadSampleAsFile(sample: TrainableSample) {
  const previewUrl = await createSamplePreviewUrl(sample.filePath)

  try {
    const response = await fetch(previewUrl)

    if (!response.ok) {
      throw new Error(`Failed to read sample ${sample.id}.`)
    }

    const blob = await response.blob()
    const fileName =
      sample.originalFileName ??
      sample.filePath.split("/").pop() ??
      `${sample.id}.jpg`

    return new File([blob], fileName, {
      type: blob.type || "image/jpeg",
    })
  } finally {
    URL.revokeObjectURL(previewUrl)
  }
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
  validationSplit: number
}) {
  const events: ModelTrainLogEvent[] = []
  const startedAt = performance.now()
  let trainXs: tf.Tensor | null = null
  let trainYs: tf.Tensor | null = null
  let validationXs: tf.Tensor | null = null
  let validationYs: tf.Tensor | null = null
  let classifier: tf.LayersModel | null = null

  async function pushEvent(event: ModelTrainLogEvent) {
    events.push(event)
    await onEvent?.(event)
  }

  try {
    await pushEvent({
      at: new Date().toISOString(),
      message: "Initializing TensorFlow.js",
      type: "phase",
    })
    await initTf()

    await pushEvent({
      at: new Date().toISOString(),
      message: "Loading MobileNet feature extractor",
      type: "phase",
    })
    const embeddingModel = await loadMobilenetModel()

    await pushEvent({
      at: new Date().toISOString(),
      message: "Preparing train and validation split",
      type: "phase",
    })

    const splitResults = classes.map((trainableClass) =>
      splitClassSamples(trainableClass, validationSplit),
    )
    const datasetSnapshot: ProjectTrainDatasetSnapshot = {
      classCount: splitResults.length,
      totalSamples: splitResults.reduce((sum, item) => sum + item.allSamples, 0),
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

    await pushEvent({
      at: new Date().toISOString(),
      message: "Loading training images from local storage",
      type: "phase",
    })

    const trainGroups = await Promise.all(
      splitResults.map(async (item, labelIndex) => ({
        files: await Promise.all(item.trainSamples.map((sample) => loadSampleAsFile(sample))),
        labelIndex,
      })),
    )
    const validationGroups = await Promise.all(
      splitResults.map(async (item, labelIndex) => ({
        files: await Promise.all(
          item.validationSamples.map((sample) => loadSampleAsFile(sample)),
        ),
        labelIndex,
      })),
    )

    await pushEvent({
      at: new Date().toISOString(),
      message: "Building embeddings",
      type: "phase",
    })

    const trainDataset = await buildMobilenetEmbeddingDatasetFromGroups({
      groups: trainGroups,
      embeddingModel,
      fileToTensor: fileToImageTensor,
      imageSize,
    })
    const validationDataset = await buildMobilenetEmbeddingDatasetFromGroups({
      groups: validationGroups,
      embeddingModel,
      fileToTensor: fileToImageTensor,
      imageSize,
    })

    trainXs = trainDataset.xs
    trainYs = trainDataset.ys
    validationXs = validationDataset.xs
    validationYs = validationDataset.ys

    await pushEvent({
      at: new Date().toISOString(),
      message: "Creating classifier head",
      type: "phase",
    })

    classifier = createMobilenetClassifierHead(
      trainDataset.inputShape,
      trainDataset.numClasses,
      { learningRate },
    )

    await pushEvent({
      at: new Date().toISOString(),
      message: "Training classifier",
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
      onEpochEnd: async (log) => {
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

    await pushEvent({
      at: new Date().toISOString(),
      message: "Saving trained model",
      type: "phase",
    })

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

    const lastEpochEvent =
      events.filter((event) => event.type === "epoch").slice(-1)[0] ?? null
    const durationMs = trainResult.trainTimeMs

    return {
      artifactPath,
      datasetSnapshot,
      events,
      inputShape: trainDataset.inputShape,
      summary: {
        accuracy: lastEpochEvent?.acc ?? null,
        durationMs,
        loss: lastEpochEvent?.loss ?? null,
        validationAccuracy: lastEpochEvent?.valAcc ?? null,
        validationLoss: lastEpochEvent?.valLoss ?? null,
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
