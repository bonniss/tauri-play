import * as tf from '@tensorflow/tfjs'

export function createTinyModel(inputShape: number[], numClasses: number) {
  const model = tf.sequential()

  model.add(tf.layers.flatten({ inputShape }))

  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
  }))

  model.add(tf.layers.dense({
    units: numClasses,
    activation: 'softmax',
  }))

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  })

  return model
}

export async function trainModel({
  model,
  xs,
  ys,
  epochs = 10,
  batchSize = 16,
  onEpochEnd,
}: {
  model: tf.LayersModel
  xs: tf.Tensor
  ys: tf.Tensor
  epochs?: number
  batchSize?: number
  onEpochEnd?: (log: {
    epoch: number
    loss: number
    acc?: number
  }) => void
}) {
  const start = performance.now()

  await model.fit(xs, ys, {
    epochs,
    batchSize,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onEpochEnd?.({
          epoch,
          loss: logs?.loss ?? 0,
          acc: logs?.acc as number | undefined,
        })
      },
    },
  })

  const end = performance.now()

  return {
    trainTimeMs: end - start,
  }
}