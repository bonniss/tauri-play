import * as tf from "@tensorflow/tfjs"

export async function predictSample({
  model,
  sample,
}: {
  model: tf.LayersModel
  sample: tf.Tensor
}) {
  const start = performance.now()

  const probs = tf.tidy(() => {
    const batched = sample.expandDims(0)
    const output = model.predict(batched) as tf.Tensor
    return output.dataSync()
  })

  const end = performance.now()

  const values = Array.from(probs)
  const predictedClass = values.indexOf(Math.max(...values))

  return {
    predictedClass,
    confidences: values,
    predictTimeMs: end - start,
  }
}
