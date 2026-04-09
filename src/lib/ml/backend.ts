import * as tf from '@tensorflow/tfjs';

export async function initTf() {
  const start = performance.now();

  await tf.ready();

  const backend = tf.getBackend();
  const end = performance.now();
  console.log(`TensorFlow.js is ready. Backend: ${backend}. Initialization took ${end - start} ms.`);
  return {
    backend,
    initTimeMs: end - start,
  }
}

export function getMemory() {
  return tf.memory();
}
