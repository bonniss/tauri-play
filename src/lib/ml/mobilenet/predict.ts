import * as tf from "@tensorflow/tfjs"
import type { MobileNet } from "@tensorflow-models/mobilenet"
import { createImageEmbedding } from "./dataset"

export async function predictWithMobilenetClassifier({
  classifier,
  embeddingModel,
  file,
  fileToTensor,
  imageSize = 224,
}: {
  classifier: tf.LayersModel
  embeddingModel: MobileNet
  file: File
  fileToTensor: (file: File, size?: number) => Promise<tf.Tensor3D>
  imageSize?: number
}) {
  const start = performance.now()
  const embedding = await createImageEmbedding({
    embeddingModel,
    file,
    fileToTensor,
    imageSize,
  })

  try {
    const probs = tf.tidy(() => {
      const batched = embedding.expandDims(0)
      const output = classifier.predict(batched) as tf.Tensor
      return Array.from(output.dataSync())
    })

    const end = performance.now()
    const predictedClass = probs.indexOf(Math.max(...probs))

    return {
      predictedClass,
      confidences: probs,
      predictTimeMs: end - start,
    }
  } finally {
    embedding.dispose()
  }
}
