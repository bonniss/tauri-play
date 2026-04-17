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
      const pixels = tf.browser.fromPixels(img) // [H, W, 3] int32 [0,255]
      const resized = tf.image.resizeBilinear(pixels, [size, size])
      return resized.toFloat() as tf.Tensor3D // keep [0,255] — mobilenet.infer() normalizes internally
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}