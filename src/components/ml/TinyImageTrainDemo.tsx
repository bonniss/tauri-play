import type { MobileNet } from "@tensorflow-models/mobilenet"
import * as tf from "@tensorflow/tfjs"
import { useMemo, useRef, useState } from "react"
import { getMemory } from "~/lib/ml/backend"
import { fileToImageTensor } from "~/lib/ml/sample/image"
import { buildMobilenetEmbeddingDataset } from "~/lib/ml/mobilenet/dataset"
import { loadMobilenetModel, createMobilenetClassifierHead } from "~/lib/ml/mobilenet/model"
import { predictWithMobilenetClassifier } from "~/lib/ml/mobilenet/predict"
import { trainMobilenetClassifier } from "~/lib/ml/mobilenet/train"

const IMAGE_SIZE = 224

const TinyImageTrainDemo = () => {
  const xsRef = useRef<tf.Tensor2D | null>(null)
  const ysRef = useRef<tf.Tensor2D | null>(null)
  const classifierRef = useRef<tf.LayersModel | null>(null)
  const embeddingModelRef = useRef<MobileNet | null>(null)

  const [class0Files, setClass0Files] = useState<File[]>([])
  const [class1Files, setClass1Files] = useState<File[]>([])
  const [testFile, setTestFile] = useState<File | null>(null)

  const [datasetInfo, setDatasetInfo] = useState<{
    sampleCount: number
    inputShape: number[]
    numClasses: number
  } | null>(null)

  const [featureExtractorReady, setFeatureExtractorReady] = useState(false)
  const [classifierReady, setClassifierReady] = useState(false)
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
  const canCreateClassifier = !!datasetInfo
  const canTrain = !!xsRef.current && !!ysRef.current && !!classifierRef.current
  const canPredict =
    !!classifierRef.current && !!embeddingModelRef.current && !!testFile

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
    setFeatureExtractorReady(false)
    setClassifierReady(false)
    classifierRef.current?.dispose()
    classifierRef.current = null

    try {
      if (!embeddingModelRef.current) {
        setStatus("loading mobilenet")
        embeddingModelRef.current = await loadMobilenetModel()
      }

      const data = await buildMobilenetEmbeddingDataset({
        class0Files,
        class1Files,
        imageSize: IMAGE_SIZE,
        embeddingModel: embeddingModelRef.current,
        fileToTensor: fileToImageTensor,
      })

      xsRef.current = data.xs
      ysRef.current = data.ys

      setDatasetInfo({
        sampleCount: data.sampleCount,
        inputShape: data.inputShape,
        numClasses: data.numClasses,
      })
      setFeatureExtractorReady(true)
      setStatus("embedding dataset ready")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "build dataset failed")
    }
  }

  function handleCreateModel() {
    if (!datasetInfo) return

    classifierRef.current?.dispose()
    classifierRef.current = createMobilenetClassifierHead(
      datasetInfo.inputShape,
      datasetInfo.numClasses,
    )
    setClassifierReady(true)
    setStatus(`classifier ready (${classifierRef.current.countParams()} params)`)
  }

  async function handleTrain() {
    if (!classifierRef.current || !xsRef.current || !ysRef.current) return

    setStatus("training")
    setLogs([])
    setTrainTimeMs(null)

    try {
      const result = await trainMobilenetClassifier({
        model: classifierRef.current,
        xs: xsRef.current,
        ys: ysRef.current,
        epochs: 20,
        batchSize: 8,
        onEpochEnd: (log) => {
          setLogs((prev) => [...prev, log])
        },
      })

      const evalResult = classifierRef.current.evaluate(
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
    if (!classifierRef.current || !embeddingModelRef.current || !testFile) return

    setStatus("predicting")
    setPrediction(null)
    const result = await predictWithMobilenetClassifier({
      classifier: classifierRef.current,
      embeddingModel: embeddingModelRef.current,
      file: testFile,
      fileToTensor: fileToImageTensor,
      imageSize: IMAGE_SIZE,
    })

    setPrediction(result)
    setStatus("predict done")
  }

  function handleMemory() {
    setMemory(getMemory())
  }

  function handleReset() {
    xsRef.current?.dispose()
    ysRef.current?.dispose()
    classifierRef.current?.dispose()

    xsRef.current = null
    ysRef.current = null
    classifierRef.current = null
    embeddingModelRef.current = null

    setDatasetInfo(null)
    setFeatureExtractorReady(false)
    setClassifierReady(false)
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
            <div>Feature extractor: {featureExtractorReady ? "MobileNet ready" : "not loaded"}</div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex gap-2">
          <button
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
            onClick={handleCreateModel}
            disabled={!canCreateClassifier}
          >
            Create Classifier
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
        <div className="text-sm">Feature extractor ready: {featureExtractorReady ? "yes" : "no"}</div>
        <div className="text-sm">Classifier ready: {classifierReady ? "yes" : "no"}</div>
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
