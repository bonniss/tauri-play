import * as tf from "@tensorflow/tfjs"

export async function trainMobilenetClassifier({
  model,
  xs,
  ys,
  epochs = 20,
  batchSize = 8,
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
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        onEpochEnd?.({
          epoch,
          loss: logs?.loss ?? 0,
          acc: (logs?.accuracy ?? logs?.acc) as number | undefined,
        })
      },
    },
  })

  return {
    trainTimeMs: performance.now() - start,
  }
}
