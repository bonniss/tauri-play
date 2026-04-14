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

export async function buildImageClassificationDataset({
  class0Files,
  class1Files,
  imageSize = 128,
  fileToTensor,
}: {
  class0Files: File[]
  class1Files: File[]
  imageSize?: number
  fileToTensor: (file: File, size?: number) => Promise<tf.Tensor3D>
}) {
  const xsList: tf.Tensor3D[] = []
  const labels: number[] = []

  for (const file of class0Files) {
    xsList.push(await fileToTensor(file, imageSize))
    labels.push(0)
  }

  for (const file of class1Files) {
    xsList.push(await fileToTensor(file, imageSize))
    labels.push(1)
  }

  const xs = tf.stack(xsList) as tf.Tensor4D
  const ys = tf.oneHot(tf.tensor1d(labels, "int32"), 2)

  xsList.forEach((t) => t.dispose())

  console.log("class0Files", class0Files.length)
  console.log("class1Files", class1Files.length)
  console.log("labels", labels.slice(0, 10), labels.slice(-10))
  ys.print()
  console.log("xs shape", xs.shape)
  console.log("ys shape", ys.shape)
  
  return {
    xs,
    ys,
    numClasses: 2,
    sampleCount: labels.length,
    inputShape: [imageSize, imageSize, 3],
  }
}
