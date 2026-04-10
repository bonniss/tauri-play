import * as tf from "@tensorflow/tfjs"

export function createSyntheticDataset({
  numSamplesPerClass = 50,
  imageSize = 32,
}: {
  numSamplesPerClass?: number
  imageSize?: number
}) {
  const numClasses = 2
  const total = numSamplesPerClass * numClasses

  const xs: tf.Tensor[] = []
  const ys: number[] = []

  for (let i = 0; i < numSamplesPerClass; i++) {
    // Class 0: left bright
    xs.push(generateImage(imageSize, "left"))
    ys.push(0)

    // Class 1: right bright
    xs.push(generateImage(imageSize, "right"))
    ys.push(1)
  }

  const xTensor = tf.stack(xs)
  const yTensor = tf.oneHot(tf.tensor1d(ys, "int32"), numClasses)

  // cleanup temp tensors
  xs.forEach((t) => t.dispose())

  return {
    xs: xTensor,
    ys: yTensor,
    numClasses,
    sampleCount: total,
    inputShape: [imageSize, imageSize, 1],
  }
}

function generateImage(size: number, type: "left" | "right") {
  return tf.tidy(() => {
    const img = tf.zeros([size, size, 1])

    const mid = Math.floor(size / 2)

    if (type === "left") {
      const left = tf.ones([size, mid, 1])
      return tf.concat([left, tf.zeros([size, size - mid, 1])], 1)
    } else {
      const right = tf.ones([size, size - mid, 1])
      return tf.concat([tf.zeros([size, mid, 1]), right], 1)
    }
  })
}

export function createSyntheticSample(
  imageSize: number,
  type: "left" | "right",
) {
  return tf.tidy(() => {
    const mid = Math.floor(imageSize / 2)

    if (type === "left") {
      const left = tf.ones([imageSize, mid, 1])
      return tf.concat([left, tf.zeros([imageSize, imageSize - mid, 1])], 1)
    }

    const right = tf.ones([imageSize, imageSize - mid, 1])
    return tf.concat([tf.zeros([imageSize, mid, 1]), right], 1)
  })
}