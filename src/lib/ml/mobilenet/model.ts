import * as mobilenet from "@tensorflow-models/mobilenet"
import * as tf from "@tensorflow/tfjs"

let mobilenetPromise: Promise<mobilenet.MobileNet> | null = null

export const MOBILENET_VERSION = 2
export const MOBILENET_ALPHA = 1

const LOCAL_MODEL_URL = `/models/mobilenet/v${MOBILENET_VERSION}/model.json`

export function loadMobilenetModel() {
  if (!mobilenetPromise) {
    mobilenetPromise = mobilenet.load({
      version: MOBILENET_VERSION,
      alpha: MOBILENET_ALPHA,
      modelUrl: LOCAL_MODEL_URL,
    })
  }

  return mobilenetPromise
}

export function createMobilenetClassifierHead(
  inputShape: number[],
  numClasses: number,
  options?: {
    learningRate?: number
  },
) {
  const model = tf.sequential()

  model.add(
    tf.layers.dense({
      inputShape,
      units: 128,
      activation: "relu",
    }),
  )

  model.add(tf.layers.dropout({ rate: 0.2 }))

  model.add(
    tf.layers.dense({
      units: numClasses,
      activation: "softmax",
    }),
  )

  model.compile({
    optimizer: tf.train.adam(options?.learningRate ?? 0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  })

  return model
}
