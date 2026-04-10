import * as tf from "@tensorflow/tfjs"
import { useMemo, useRef, useState } from "react"
import { getMemory } from "~/lib/ml/backend"
import { buildImageClassificationDataset } from "~/lib/ml/sample/dataset"
import { fileToImageTensor } from "~/lib/ml/sample/image"
import { predictSample } from "~/lib/ml/sample/predict"
import { createTinyModel, trainModel } from "~/lib/ml/sample/train"

const IMAGE_SIZE = 128

const TinyImageTrainDemo = () => {
  const xsRef = useRef<tf.Tensor4D | null>(null)
  const ysRef = useRef<tf.Tensor2D | null>(null)
  const modelRef = useRef<tf.LayersModel | null>(null)
  const testTensorRef = useRef<tf.Tensor3D | null>(null)

  const [class0Files, setClass0Files] = useState<File[]>([])
  const [class1Files, setClass1Files] = useState<File[]>([])
  const [testFile, setTestFile] = useState<File | null>(null)

  const [datasetInfo, setDatasetInfo] = useState<{
    sampleCount: number
    inputShape: number[]
    numClasses: number
  } | null>(null)

  const [modelReady, setModelReady] = useState(false)
  const [logs, setLogs] = useState<
    { epoch: number; loss: number; acc?: number }[]
  >([])
  const [trainTimeMs, setTrainTimeMs] = useState<number | null>(null)
  const [prediction, setPrediction] = useState<{
    predictedClass: number
    confidences: number[]
    predictTimeMs: number
  } | null>(null)
  const [status, setStatus] = useState("idle")
  const [memory, setMemory] = useState<ReturnType<typeof getMemory> | null>(
    null,
  )

  const canBuildDataset = class0Files.length > 0 && class1Files.length > 0
  const canTrain = !!xsRef.current && !!ysRef.current && modelReady
  const canPredict = !!modelRef.current && !!testFile

  const class0Preview = useMemo(
    () => class0Files.map((f) => URL.createObjectURL(f)),
    [class0Files],
  )
  const class1Preview = useMemo(
    () => class1Files.map((f) => URL.createObjectURL(f)),
    [class1Files],
  )
  const testPreview = useMemo(
    () => (testFile ? URL.createObjectURL(testFile) : null),
    [testFile],
  )

  async function handleBuildDataset() {
    setStatus("building dataset")

    xsRef.current?.dispose()
    ysRef.current?.dispose()
    xsRef.current = null
    ysRef.current = null
    setDatasetInfo(null)
    setModelReady(false)
    modelRef.current?.dispose()
    modelRef.current = null

    try {
      const data = await buildImageClassificationDataset({
        class0Files,
        class1Files,
        imageSize: IMAGE_SIZE,
        fileToTensor: fileToImageTensor,
      })

      xsRef.current = data.xs
      ysRef.current = data.ys as tf.Tensor2D

      setDatasetInfo({
        sampleCount: data.sampleCount,
        inputShape: data.inputShape,
        numClasses: data.numClasses,
      })
      setStatus("dataset ready")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "build dataset failed")
    }
  }

  function handleCreateModel() {
    if (!datasetInfo) return

    modelRef.current?.dispose()
    modelRef.current = createTinyModel(
      datasetInfo.inputShape,
      datasetInfo.numClasses,
    )
    setModelReady(true)
    setStatus(`model ready (${modelRef.current.countParams()} params)`)
  }

  async function handleTrain() {
    if (!modelRef.current || !xsRef.current || !ysRef.current) return

    setStatus("training")
    setLogs([])
    setTrainTimeMs(null)

    try {
      const result = await trainModel({
        model: modelRef.current,
        xs: xsRef.current,
        ys: ysRef.current,
        epochs: 10,
        batchSize: 8,
        onEpochEnd: (log) => {
          setLogs((prev) => [...prev, log])
        },
      })

      const evalResult = modelRef.current.evaluate(
        xsRef.current,
        ysRef.current,
      ) as tf.Tensor[]
      const values = await Promise.all(evalResult.map((t) => t.data()))
      console.log("evaluate train set", values)

      setTrainTimeMs(result.trainTimeMs)
      setStatus("train done")

      console.log("final logs", logs)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "train failed")
    }
  }

  async function handlePredict() {
    if (!modelRef.current || !testFile) return

    setStatus("predicting")
    setPrediction(null)

    testTensorRef.current?.dispose()
    testTensorRef.current = await fileToImageTensor(testFile, IMAGE_SIZE)

    const result = await predictSample({
      model: modelRef.current,
      sample: testTensorRef.current,
    })

    setPrediction(result)
    setStatus("predict done")
  }

  function handleMemory() {
    setMemory(getMemory())
  }

  async function handlePredictFirstTrainSample() {
    if (!modelRef.current || !xsRef.current) return

    const sample = tf.tidy(() =>
      xsRef.current!.slice([0, 0, 0, 0], [1, IMAGE_SIZE, IMAGE_SIZE, 3]),
    )

    const output = modelRef.current.predict(sample) as tf.Tensor
    output.print()

    sample.dispose()
    output.dispose()
  }

  function handleReset() {
    xsRef.current?.dispose()
    ysRef.current?.dispose()
    modelRef.current?.dispose()
    testTensorRef.current?.dispose()

    xsRef.current = null
    ysRef.current = null
    modelRef.current = null
    testTensorRef.current = null

    setDatasetInfo(null)
    setModelReady(false)
    setLogs([])
    setTrainTimeMs(null)
    setPrediction(null)
    setMemory(null)
    setStatus("reset done")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tiny Image Train Demo</h2>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block font-medium">Class 0 images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setClass0Files(Array.from(e.target.files ?? []))}
            />
            <div className="text-sm text-zinc-500">
              {class0Files.length} files
            </div>
            <div className="grid grid-cols-4 gap-2">
              {class0Preview.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="aspect-square rounded object-cover"
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Class 1 images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setClass1Files(Array.from(e.target.files ?? []))}
            />
            <div className="text-sm text-zinc-500">
              {class1Files.length} files
            </div>
            <div className="grid grid-cols-4 gap-2">
              {class1Preview.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="aspect-square rounded object-cover"
                />
              ))}
            </div>
          </div>
        </div>

        <button
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          onClick={handleBuildDataset}
          disabled={!canBuildDataset}
        >
          Build Dataset
        </button>

        {datasetInfo && (
          <div className="text-sm space-y-1">
            <div>Samples: {datasetInfo.sampleCount}</div>
            <div>Input shape: {JSON.stringify(datasetInfo.inputShape)}</div>
            <div>Classes: {datasetInfo.numClasses}</div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-2">
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            onClick={handleCreateModel}
            disabled={!datasetInfo}
          >
            Create Model
          </button>

          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            onClick={handleTrain}
            disabled={!canTrain}
          >
            Train
          </button>

          <button
            className="rounded bg-black px-3 py-2 text-white"
            onClick={handleMemory}
          >
            Snapshot Memory
          </button>

          <button
            className="rounded bg-red-600 px-3 py-2 text-white"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>

        <div className="text-sm">Status: {status}</div>
        <div className="text-sm">Model ready: {modelReady ? "yes" : "no"}</div>
        {trainTimeMs !== null && (
          <div className="text-sm">Train time: {trainTimeMs.toFixed(2)} ms</div>
        )}

        <div className="max-h-48 overflow-auto rounded bg-zinc-50 p-3 text-sm">
          {logs.map((l, i) => (
            <div key={i}>
              epoch {l.epoch} - loss {l.loss.toFixed(4)} - acc{" "}
              {(l.acc ?? 0).toFixed(4)}
            </div>
          ))}
        </div>

        {memory && (
          <div className="text-sm space-y-1">
            <div>Tensors: {memory.numTensors}</div>
            <div>Bytes: {memory.numBytes}</div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <label className="block font-medium">Test image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setTestFile(e.target.files?.[0] ?? null)}
        />

        {testPreview && (
          <img src={testPreview} alt="" className="h-40 rounded object-cover" />
        )}

        <button
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          onClick={handlePredict}
          disabled={!canPredict}
        >
          Predict
        </button>

        {prediction && (
          <div className="text-sm space-y-1">
            <div>Predicted class: {prediction.predictedClass}</div>
            <div>
              Confidences:{" "}
              {prediction.confidences.map((v) => v.toFixed(4)).join(", ")}
            </div>
            <div>Predict time: {prediction.predictTimeMs.toFixed(2)} ms</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TinyImageTrainDemo
