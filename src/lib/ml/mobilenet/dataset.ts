import * as tf from "@tensorflow/tfjs"
import type { MobileNet } from "@tensorflow-models/mobilenet"

export type MobilenetDatasetGroup = {
  files: File[]
  labelIndex: number
}

export async function buildMobilenetEmbeddingDatasetFromGroups({
  groups,
  embeddingModel,
  fileToTensor,
  imageSize = 224,
}: {
  groups: MobilenetDatasetGroup[]
  embeddingModel: MobileNet
  fileToTensor: (file: File, size?: number) => Promise<tf.Tensor3D>
  imageSize?: number
}) {
  const embeddings: tf.Tensor1D[] = []
  const labels: number[] = []

  for (const group of groups) {
    for (const file of group.files) {
      const embedding = await createImageEmbedding({
        embeddingModel,
        file,
        fileToTensor,
        imageSize,
      })

      embeddings.push(embedding)
      labels.push(group.labelIndex)
    }
  }

  if (!embeddings.length) {
    throw new Error("Dataset is empty.")
  }

  const xs = tf.stack(embeddings) as tf.Tensor2D
  const labelTensor = tf.tensor1d(labels, "int32")
  const numClasses = groups.length
  const ys = tf.oneHot(labelTensor, numClasses) as tf.Tensor2D

  embeddings.forEach((tensor) => tensor.dispose())
  labelTensor.dispose()

  return {
    xs,
    ys,
    numClasses,
    sampleCount: labels.length,
    inputShape: [xs.shape[1]],
  }
}

export async function buildMobilenetEmbeddingDataset({
  class0Files,
  class1Files,
  embeddingModel,
  fileToTensor,
  imageSize = 224,
}: {
  class0Files: File[]
  class1Files: File[]
  embeddingModel: MobileNet
  fileToTensor: (file: File, size?: number) => Promise<tf.Tensor3D>
  imageSize?: number
}) {
  return buildMobilenetEmbeddingDatasetFromGroups({
    groups: [
      { files: class0Files, labelIndex: 0 },
      { files: class1Files, labelIndex: 1 },
    ],
    embeddingModel,
    fileToTensor,
    imageSize,
  })
}

export async function createImageEmbedding({
  embeddingModel,
  file,
  fileToTensor,
  imageSize = 224,
}: {
  embeddingModel: MobileNet
  file: File
  fileToTensor: (file: File, size?: number) => Promise<tf.Tensor3D>
  imageSize?: number
}) {
  const imageTensor = await fileToTensor(file, imageSize)

  try {
    return tf.tidy(() => {
      const batched = imageTensor.expandDims(0)
      const embedding = embeddingModel.infer(batched, true) as tf.Tensor

      return embedding.squeeze() as tf.Tensor1D
    })
  } finally {
    imageTensor.dispose()
  }
}
