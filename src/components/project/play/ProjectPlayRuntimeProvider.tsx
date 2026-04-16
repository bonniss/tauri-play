import type { MobileNet } from "@tensorflow-models/mobilenet"
import type * as tf from "@tensorflow/tfjs"
import { useQuery } from "@tanstack/react-query"
import { createProvider } from "react-easy-provider"
import { useEffect, useMemo, useRef, useState } from "react"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import { getProjectModel } from "~/lib/db/domain/models"
import { initTf } from "~/lib/ml/backend"
import { loadMobilenetModel } from "~/lib/ml/mobilenet/model"
import { predictWithMobilenetClassifier } from "~/lib/ml/mobilenet/predict"
import { loadMobilenetClassifierModel } from "~/lib/ml/mobilenet/storage"
import { fileToImageTensor } from "~/lib/ml/sample/image"

type PredictionResult = {
  confidences: number[]
  predictedClass: number
  predictTimeMs: number
}

function captureVideoFrameFile(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not read the current camera frame.")
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode the current camera frame."))
          return
        }

        resolve(
          new File([blob], `camera-frame-${Date.now()}.jpg`, {
            type: "image/jpeg",
          }),
        )
      },
      "image/jpeg",
      0.92,
    )
  })
}

export const [useProjectPlayRuntime, ProjectPlayRuntimeProvider] =
  createProvider(() => {
    const { classes, playSettings, projectId } = useProjectOne()
    const projectModelQuery = useQuery({
      queryKey: ["project-model", projectId],
      queryFn: () => getProjectModel(projectId),
    })
    const [prediction, setPrediction] = useState<PredictionResult | null>(null)
    const [runtimeError, setRuntimeError] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [predictionTick, setPredictionTick] = useState(0)
    const classifierRef = useRef<tf.LayersModel | null>(null)
    const embeddingModelRef = useRef<MobileNet | null>(null)
    const modelClassNamesRef = useRef<string[]>(classes.map((item) => item.name))
    const cameraStabilityRef = useRef<{
      count: number
      predictedClass: number | null
    }>({
      count: 0,
      predictedClass: null,
    })
    const cameraInFlightRef = useRef(false)

    useEffect(() => {
      return () => {
        classifierRef.current?.dispose()
      }
    }, [])

    async function ensureModelsReady() {
      if (!projectModelQuery.data?.artifactPath) {
        throw new Error("No trained model found for this project.")
      }

      if (!embeddingModelRef.current) {
        await initTf()
        embeddingModelRef.current = await loadMobilenetModel()
      }

      if (!classifierRef.current) {
        const result = await loadMobilenetClassifierModel(
          projectModelQuery.data.artifactPath,
        )
        classifierRef.current = result.model
        modelClassNamesRef.current =
          result.metadata.classNames?.length === classes.length
            ? result.metadata.classNames
            : classes.map((item) => item.name)
      }
    }

    function commitPrediction(nextPrediction: PredictionResult) {
      setPrediction(nextPrediction)
      setPredictionTick((current) => current + 1)
    }

    function clearPrediction() {
      cameraStabilityRef.current = {
        count: 0,
        predictedClass: null,
      }
      setPrediction(null)
      setRuntimeError(null)
    }

    async function predictFile(file: File) {
      await ensureModelsReady()

      return predictWithMobilenetClassifier({
        classifier: classifierRef.current as tf.LayersModel,
        embeddingModel: embeddingModelRef.current as MobileNet,
        file,
        fileToTensor: fileToImageTensor,
        imageSize: 224,
      })
    }

    async function runPredictionFromFile(file: File) {
      setIsAnalyzing(true)
      setRuntimeError(null)
      cameraStabilityRef.current = {
        count: 0,
        predictedClass: null,
      }

      try {
        const result = await predictFile(file)
        commitPrediction(result)
      } catch (error) {
        setPrediction(null)
        setRuntimeError(
          error instanceof Error ? error.message : "Prediction failed.",
        )
      } finally {
        setIsAnalyzing(false)
      }
    }

    async function runPredictionFromVideo(
      video: HTMLVideoElement,
      options?: {
        stableCommitCount?: number
      },
    ) {
      if (cameraInFlightRef.current || video.videoWidth === 0) {
        return
      }

      cameraInFlightRef.current = true
      setIsAnalyzing(true)
      setRuntimeError(null)

      try {
        const frameFile = await captureVideoFrameFile(video)
        const result = await predictFile(frameFile)
        const stableCommitCount = options?.stableCommitCount ?? 2

        if (cameraStabilityRef.current.predictedClass === result.predictedClass) {
          cameraStabilityRef.current.count += 1
        } else {
          cameraStabilityRef.current = {
            count: 1,
            predictedClass: result.predictedClass,
          }
        }

        if (cameraStabilityRef.current.count >= stableCommitCount) {
          commitPrediction(result)
        }
      } catch (error) {
        setRuntimeError(
          error instanceof Error ? error.message : "Prediction failed.",
        )
      } finally {
        cameraInFlightRef.current = false
        setIsAnalyzing(false)
      }
    }

    const rankedResults = useMemo(() => {
      if (!prediction) {
        return []
      }

      return prediction.confidences
        .map((confidence, index) => ({
          className:
            modelClassNamesRef.current[index] ??
            classes[index]?.name ??
            `Class ${index + 1}`,
          confidence,
          index,
        }))
        .sort((left, right) => right.confidence - left.confidence)
    }, [classes, prediction])

    const visibleResults = playSettings.showAllClasses
      ? rankedResults
      : rankedResults.slice(0, playSettings.topK)
    const topResult = rankedResults[0] ?? null
    const meetsThreshold =
      topResult != null &&
      topResult.confidence >= playSettings.confidenceThreshold

    return {
      clearPrediction,
      isAnalyzing,
      meetsThreshold,
      prediction,
      predictionTick,
      projectModel: projectModelQuery.data ?? null,
      rankedResults,
      runPredictionFromFile,
      runPredictionFromVideo,
      runtimeError,
      topResult,
      visibleResults,
    }
  })
