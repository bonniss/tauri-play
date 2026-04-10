import * as tf from "@tensorflow/tfjs"

export async function fileToImageTensor(
  file: File,
  size = 128,
): Promise<tf.Tensor3D> {
  const url = URL.createObjectURL(file)

  try {
    const img = new Image()
    img.src = url
    await img.decode()

    return tf.tidy(() => {
      const pixels = tf.browser.fromPixels(img) // [H, W, 3]
      const resized = tf.image.resizeBilinear(pixels, [size, size])
      const normalized = resized.toFloat().div(255)
      return normalized as tf.Tensor3D
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}