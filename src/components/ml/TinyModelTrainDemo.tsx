import { Button } from '@mantine/core';
import * as tf from '@tensorflow/tfjs';
import { useRef, useState } from 'react';
import { getMemory, initTf } from '~/lib/ml/backend';
import { createSyntheticDataset } from '~/lib/ml/sample/dataset';
import { createTinyModel, trainModel } from '~/lib/ml/sample/train';

export function TinyModelTrainDemo() {
  const xsRef = useRef<tf.Tensor | null>(null);
  const ysRef = useRef<tf.Tensor | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);

  const [backend, setBackend] = useState('');
  const [initTime, setInitTime] = useState(0);

  const [datasetInfo, setDatasetInfo] = useState<any>(null);

  const [logs, setLogs] = useState<
    { epoch: number; loss: number; acc?: number }[]
  >([]);

  const [trainTime, setTrainTime] = useState<number | null>(null);

  const [memory, setMemory] = useState<any>(null);

  const [modelReady, setModelReady] = useState(false);

  // --- actions

  async function handleInit() {
    const res = await initTf();
    setBackend(res.backend);
    setInitTime(res.initTimeMs);

    // sanity
    const t = tf.tensor([1, 2, 3]);
    t.add(1).print();
    t.dispose();
  }

  function handleDataset() {
    const data = createSyntheticDataset({
      numSamplesPerClass: 50,
      imageSize: 32,
    });

    xsRef.current = data.xs;
    ysRef.current = data.ys;

    setDatasetInfo({
      sampleCount: data.sampleCount,
      inputShape: data.inputShape,
      numClasses: data.numClasses,
    });
  }

  function handleCreateModel() {
    if (!datasetInfo) return;

    modelRef.current = createTinyModel(
      datasetInfo.inputShape,
      datasetInfo.numClasses,
    );

    setModelReady(true);

    console.log(modelRef.current.summary());
  }

  async function handleTrain() {
    if (!modelRef.current || !xsRef.current || !ysRef.current) return;

    setLogs([]);

    const res = await trainModel({
      model: modelRef.current,
      xs: xsRef.current,
      ys: ysRef.current,
      epochs: 10,
      batchSize: 16,
      onEpochEnd: (log) => {
        setLogs((prev) => [...prev, log]);
      },
    });

    setTrainTime(res.trainTimeMs);
  }

  function handleMemory() {
    setMemory(getMemory());
  }

  function handleReset() {
    xsRef.current?.dispose();
    ysRef.current?.dispose();
    modelRef.current?.dispose();

    xsRef.current = null;
    ysRef.current = null;
    modelRef.current = null;

    setDatasetInfo(null);
    setLogs([]);
    setTrainTime(null);
    setMemory(null);
    setModelReady(false);
  }

  // --- UI

  return (
    <div
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <h2>Tiny Model Train Demo</h2>

      {/* Runtime */}
      <div>
        <Button onClick={handleInit}>Init TF</Button>
        <div>Backend: {backend}</div>
        <div>Init time: {initTime.toFixed(2)} ms</div>
      </div>

      {/* Dataset */}
      <div>
        <Button onClick={handleDataset}>Generate Dataset</Button>
        {datasetInfo && (
          <div>
            <div>Samples: {datasetInfo.sampleCount}</div>
            <div>Input: {JSON.stringify(datasetInfo.inputShape)}</div>
            <div>Classes: {datasetInfo.numClasses}</div>
          </div>
        )}
      </div>

      {/* Model */}
      <div>
        <Button onClick={handleCreateModel}>Create Model</Button>
        {modelReady && <div style={{ color: 'green' }}>Model ready ✅</div>}
      </div>

      {/* Train */}
      <div>
        <Button onClick={handleTrain} disabled={!modelReady}>Train</Button>
        {trainTime && <div>Train time: {trainTime.toFixed(2)} ms</div>}

        <div style={{ maxHeight: 150, overflow: 'auto' }}>
          {logs.map((l, i) => (
            <div key={i}>
              epoch {l.epoch} — loss: {l.loss.toFixed(4)} — acc:{' '}
              {l.acc?.toFixed(4)}
            </div>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div>
        <Button onClick={handleMemory}>Snapshot Memory</Button>
        {memory && (
          <div>
            <div>Tensors: {memory.numTensors}</div>
            <div>Bytes: {memory.numBytes}</div>
          </div>
        )}
      </div>

      {/* Reset */}
      <div>
        <Button onClick={handleReset}>Reset</Button>
      </div>
    </div>
  );
}
