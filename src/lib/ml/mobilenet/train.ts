import * as tf from "@tensorflow/tfjs"

export async function trainMobilenetClassifier({
  model,
  xs,
  ys,
  validationData,
  signal,
  earlyStopping = false,
  earlyStoppingPatience = 3,
  epochs = 20,
  batchSize = 8,
  onEpochEnd,
}: {
  model: tf.LayersModel
  xs: tf.Tensor
  ys: tf.Tensor
  validationData?: [tf.Tensor, tf.Tensor]
  signal?: AbortSignal
  earlyStopping?: boolean
  earlyStoppingPatience?: number
  epochs?: number
  batchSize?: number
  onEpochEnd?: (log: {
    epoch: number
    loss: number
    acc?: number
    valAcc?: number
    valLoss?: number
  }) => void
}) {
  const start = performance.now()
  void earlyStopping
  void earlyStoppingPatience

  const stopIfAborted = () => {
    if (!signal?.aborted) {
      return
    }

    model.stopTraining = true
    throw signal.reason instanceof Error
      ? signal.reason
      : new Error("Training cancelled.")
  }

  stopIfAborted()

  await model.fit(xs, ys, {
    epochs,
    batchSize,
    shuffle: true,
    validationData,
    callbacks: {
      onBatchEnd: async () => {
        stopIfAborted()
      },
      onEpochEnd: async (epoch, logs) => {
        stopIfAborted()
        onEpochEnd?.({
          epoch: epoch + 1,
          loss: logs?.loss ?? 0,
          acc: (logs?.accuracy ?? logs?.acc) as number | undefined,
          valAcc: (logs?.val_accuracy ?? logs?.val_acc) as number | undefined,
          valLoss: logs?.val_loss as number | undefined,
        })
      },
    },
  })

  stopIfAborted()

  return {
    trainTimeMs: performance.now() - start,
  }
}
