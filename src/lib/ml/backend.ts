import * as tf from '@tensorflow/tfjs';

export async function initTf() {
  const start = performance.now();

  await tf.ready();

  const backend = tf.getBackend();
  const end = performance.now();

  console.log(
    `TensorFlow.js is ready. Backend: ${backend}. Initialization took ${end - start} ms.`,
  );

  const t = tf.tensor([1, 2, 3]);
  const r = t.add(1);

  r.print();
  t.dispose();
  r.dispose();

  return {
    backend,
    initTimeMs: end - start,
  };
}

export function getMemory() {
  return tf.memory();
}
