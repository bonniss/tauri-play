import { BaseDirectory, mkdir, readFile, readTextFile, writeFile } from "@tauri-apps/plugin-fs"
import * as tf from "@tensorflow/tfjs"

const MODEL_DIRECTORY_PATH = "ml-lab/mobilenet/latest"

export type MobilenetClassifierMetadata = {
  classNames?: string[]
  imageSize: number
  inputShape: number[]
  mobilenetAlpha: number
  mobilenetVersion: number
  numClasses: number
  savedAt: string
}

type CompleteModelArtifacts = tf.io.ModelArtifacts & {
  modelTopology: tf.io.ModelJSON["modelTopology"]
  weightData: ArrayBuffer
  weightSpecs: tf.io.WeightsManifestEntry[]
}

type StoredModelJson = {
  convertedBy?: string
  format: string
  generatedBy?: string
  modelTopology: tf.io.ModelJSON["modelTopology"]
  weightsManifest: tf.io.WeightsManifestConfig
}

function getModelPaths(directoryPath: string) {
  return {
    modelJsonPath: `${directoryPath}/model.json`,
    modelWeightsPath: `${directoryPath}/weights.bin`,
    modelMetadataPath: `${directoryPath}/metadata.json`,
  }
}

export async function saveMobilenetClassifierModel({
  directoryPath = MODEL_DIRECTORY_PATH,
  imageSize,
  metadata,
  model,
}: {
  directoryPath?: string
  imageSize: number
  metadata: Omit<MobilenetClassifierMetadata, "imageSize" | "savedAt">
  model: tf.LayersModel
}) {
  let savedArtifacts: tf.io.ModelArtifacts | null = null

  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      savedArtifacts = artifacts

      return {
        modelArtifactsInfo: tf.io.getModelArtifactsInfoForJSON(artifacts),
      }
    }),
  )

  if (!savedArtifacts) {
    throw new Error("Classifier artifacts were incomplete during save.")
  }

  const artifacts = savedArtifacts as CompleteModelArtifacts

  if (!artifacts.modelTopology || !artifacts.weightSpecs || !artifacts.weightData) {
    throw new Error("Classifier artifacts were incomplete during save.")
  }

  await mkdir(directoryPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  })
  const { modelJsonPath, modelMetadataPath, modelWeightsPath } =
    getModelPaths(directoryPath)

  const modelJson: StoredModelJson = {
    convertedBy: artifacts.convertedBy ?? undefined,
    format: artifacts.format ?? "layers-model",
    generatedBy: artifacts.generatedBy ?? undefined,
    modelTopology: artifacts.modelTopology,
    weightsManifest: [
      {
        paths: ["weights.bin"],
        weights: artifacts.weightSpecs,
      },
    ],
  }

  const fullMetadata: MobilenetClassifierMetadata = {
    ...metadata,
    imageSize,
    savedAt: new Date().toISOString(),
  }

  await writeFile(
    modelJsonPath,
    new TextEncoder().encode(JSON.stringify(modelJson, null, 2)),
    {
      baseDir: BaseDirectory.AppData,
    },
  )

  await writeFile(
    modelWeightsPath,
    new Uint8Array(artifacts.weightData),
    {
      baseDir: BaseDirectory.AppData,
    },
  )

  await writeFile(
    modelMetadataPath,
    new TextEncoder().encode(JSON.stringify(fullMetadata, null, 2)),
    {
      baseDir: BaseDirectory.AppData,
    },
  )

  return {
    directoryPath,
    metadata: fullMetadata,
  }
}

export async function loadMobilenetClassifierModel(directoryPath = MODEL_DIRECTORY_PATH) {
  const { modelJsonPath, modelMetadataPath, modelWeightsPath } =
    getModelPaths(directoryPath)
  const [modelJsonText, metadataText, weightBytes] = await Promise.all([
    readTextFile(modelJsonPath, {
      baseDir: BaseDirectory.AppData,
    }),
    readTextFile(modelMetadataPath, {
      baseDir: BaseDirectory.AppData,
    }),
    readFile(modelWeightsPath, {
      baseDir: BaseDirectory.AppData,
    }),
  ])

  const modelJson = JSON.parse(modelJsonText) as StoredModelJson
  const metadata = JSON.parse(metadataText) as MobilenetClassifierMetadata
  const weightSpecs = modelJson.weightsManifest[0]?.weights

  if (!weightSpecs?.length) {
    throw new Error("Saved classifier weights metadata is missing.")
  }

  const model = await tf.loadLayersModel({
    load: async () => {
      return {
        convertedBy: modelJson.convertedBy,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        modelTopology: modelJson.modelTopology,
        weightData: weightBytes.buffer.slice(
          weightBytes.byteOffset,
          weightBytes.byteOffset + weightBytes.byteLength,
        ),
        weightSpecs,
      }
    },
  })

  return {
    metadata,
    model,
  }
}
