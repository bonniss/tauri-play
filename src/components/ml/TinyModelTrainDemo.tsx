import { Button } from "@mantine/core"
import * as tf from "@tensorflow/tfjs"
import { useRef, useState } from "react"
import { getMemory, initTf } from "~/lib/ml/backend"
import {
  createSyntheticDataset,
  createSyntheticSample,
} from "~/lib/ml/sample/dataset"
import { predictSample } from "~/lib/ml/sample/predict"
import { createTinyModel, trainModel } from "~/lib/ml/sample/train"

export function TinyModelTrainDemo() {
  const xsRef = useRef<tf.Tensor | null>(null)
  const ysRef = useRef<tf.Tensor | null>(null)
  const modelRef = useRef<tf.LayersModel | null>(null)

  const [backend, setBackend] = useState("")
  const [initTime, setInitTime] = useState(0)

  const [datasetInfo, setDatasetInfo] = useState<any>(null)

  const [logs, setLogs] = useState<
    { epoch: number; loss: number; acc?: number }[]
  >([])

  const [trainTime, setTrainTime] = useState<number | null>(null)

  const [memory, setMemory] = useState<any>(null)

  const [modelReady, setModelReady] = useState(false)

  const sampleLeftRef = useRef<tf.Tensor | null>(null)
  const sampleRightRef = useRef<tf.Tensor | null>(null)

  const [prediction, setPrediction] = useState<{
    label: string
    predictedClass: number
    confidences: number[]
    predictTimeMs: number
  } | null>(null)

  // --- actions

  async function handleInit() {
    const res = await initTf()
    setBackend(res.backend)
    setInitTime(res.initTimeMs)

    // sanity
    const t = tf.tensor([1, 2, 3])
    t.add(1).print()
    t.dispose()
  }

  function handleDataset() {
    const data = createSyntheticDataset({
      numSamplesPerClass: 50,
      imageSize: 32,
    })

    xsRef.current = data.xs
    ysRef.current = data.ys

    setDatasetInfo({
      sampleCount: data.sampleCount,
      inputShape: data.inputShape,
      numClasses: data.numClasses,
    })

    sampleLeftRef.current?.dispose()
    sampleRightRef.current?.dispose()

    sampleLeftRef.current = createSyntheticSample(data.inputShape[0], "left")
    sampleRightRef.current = createSyntheticSample(data.inputShape[0], "right")

    console.log("samples ready", {
      left: !!sampleLeftRef.current,
      right: !!sampleRightRef.current,
    })
  }

  function handleCreateModel() {
    if (!datasetInfo) return

    modelRef.current = createTinyModel(
      datasetInfo.inputShape,
      datasetInfo.numClasses,
    )

    setModelReady(true)

    console.log(modelRef.current.summary())
  }

  async function handleTrain() {
    if (!modelRef.current || !xsRef.current || !ysRef.current) return

    setLogs([])

    const res = await trainModel({
      model: modelRef.current,
      xs: xsRef.current,
      ys: ysRef.current,
      epochs: 10,
      batchSize: 16,
      onEpochEnd: (log) => {
        setLogs((prev) => [...prev, log])
      },
    })

    setTrainTime(res.trainTimeMs)
  }

  function handleMemory() {
    setMemory(getMemory())
  }

  function handleReset() {
    xsRef.current?.dispose()
    ysRef.current?.dispose()
    modelRef.current?.dispose()

    xsRef.current = null
    ysRef.current = null
    modelRef.current = null

    setDatasetInfo(null)
    setLogs([])
    setTrainTime(null)
    setMemory(null)
    setModelReady(false)
    sampleLeftRef.current?.dispose()
    sampleRightRef.current?.dispose()
    sampleLeftRef.current = null
    sampleRightRef.current = null
    setPrediction(null)
    setModelReady(false)
  }

  async function handlePredictLeft() {
    console.log("predict left click", {
      hasModel: !!modelRef.current,
      hasSample: !!sampleLeftRef.current,
    })

    if (!modelRef.current || !sampleLeftRef.current) {
      console.warn("predict left skipped")
      return
    }

    const res = await predictSample({
      model: modelRef.current,
      sample: sampleLeftRef.current,
    })

    console.log("predict left result", res)

    setPrediction({
      label: "left",
      ...res,
    })
  }

  async function handlePredictRight() {
    console.log("predict right click", {
      hasModel: !!modelRef.current,
      hasSample: !!sampleRightRef.current,
    })

    if (!modelRef.current || !sampleRightRef.current) {
      console.warn("predict right skipped")
      return
    }

    const res = await predictSample({
      model: modelRef.current,
      sample: sampleRightRef.current,
    })

    console.log("predict right result", res)

    setPrediction({
      label: "right",
      ...res,
    })
  }

  // --- UI

  return (
    <div className="space-y-4">
      <h2>Tiny Model Train Demo</h2>

      <summary>
        Workflow
        <details>
          <pre>{re}</pre>
        </details>
      </summary>

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
        {modelReady && <div style={{ color: "green" }}>Model ready ✅</div>}
      </div>

      {/* Train */}
      <div>
        <Button onClick={handleTrain} disabled={!modelReady}>
          Train
        </Button>
        {trainTime && <div>Train time: {trainTime.toFixed(2)} ms</div>}

        <div style={{ maxHeight: 150, overflow: "auto" }}>
          {logs.map((l, i) => (
            <div key={i}>
              epoch {l.epoch} — loss: {l.loss.toFixed(4)} — acc:{" "}
              {l.acc?.toFixed(4)}
            </div>
          ))}
        </div>
      </div>

      {/* Predict */}
      <div>
        <div className="flex gap-2">
          <Button
            color="pink"
            onClick={handlePredictLeft}
            disabled={!modelReady || logs.length === 0}
          >
            Predict Left
          </Button>
          <Button
            color="pink"
            onClick={handlePredictRight}
            disabled={!modelReady || logs.length === 0}
          >
            Predict Right
          </Button>
        </div>

        {prediction && (
          <pre>
            <div>Sample: {prediction.label}</div>
            <div>Predicted class: {prediction.predictedClass}</div>
            <div>
              Confidences:{" "}
              {prediction.confidences.map((v) => v.toFixed(4)).join(", ")}
            </div>
            <div>Predict time: {prediction.predictTimeMs.toFixed(2)} ms</div>
          </pre>
        )}
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
  )
}

const re = `
[1] Runtime Init
    - tf.ready()
    - chọn / xác nhận backend (cpu / webgl)
  |
  v
[2] Data Preparation
    - tạo raw data (synthetic hoặc image)
    - convert -> tensor (xs, ys)
    - normalize / shape đúng (e.g. [N, H, W, C])
  |
  v
[3] Model Definition
    - define architecture (layers)
    - compile:
        optimizer
        loss
        metrics
  |
  v
[4] Training
    - model.fit(xs, ys)
    - forward pass
    - loss computation
    - backpropagation
    - weight update (optimizer)
  |
  v
[5] Inference (Prediction)
    - input sample -> tensor
    - expand batch dim
    - model.predict(...)
    - output: logits / probabilities
  |
  v
[6] Evaluation (implicit trong demo)
    - so sánh prediction vs expected
    - quan sát confidence
  |
  v
[7] Memory Lifecycle
    - tạo tensor (data + intermediate)
    - dùng tf.tidy / dispose
    - giải phóng sau train/predict
`