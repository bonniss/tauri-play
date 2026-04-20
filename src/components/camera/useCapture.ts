import { useCallback, useEffect, useRef, useState } from "react"
import type {
  CameraCropRect,
  CameraViewportAspectRatio,
  CaptureMode,
  CapturedFrame,
  CaptureSettings,
  CaptureSession,
  CaptureSource,
} from "./types"
import { useCaptureSound } from "./useCaptureSound"

const HOLD_THRESHOLD_MS = 400

const DEFAULT_SETTINGS: CaptureSettings = {
  cropRect: null,
  fps: 4,
  mirrorCamera: false,
  recDelay: 500,
  recDuration: 2000,
}

interface UseCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  flashRef: React.RefObject<HTMLDivElement | null>
  cameraReady: boolean
  onCapture?: (frame: CapturedFrame) => void
  onCaptureSession?: (session: CaptureSession) => void
  defaultSettings?: Partial<CaptureSettings>
  viewportAspectRatio: CameraViewportAspectRatio
}

const ASPECT_RATIO_VALUE: Record<CameraViewportAspectRatio, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
}

function getViewportCropRect(
  width: number,
  height: number,
  viewportAspectRatio: CameraViewportAspectRatio,
) {
  const targetRatio = ASPECT_RATIO_VALUE[viewportAspectRatio]
  const sourceRatio = width / height

  if (Math.abs(sourceRatio - targetRatio) < 0.0001) {
    return {
      sx: 0,
      sy: 0,
      sWidth: width,
      sHeight: height,
    }
  }

  if (sourceRatio > targetRatio) {
    const sWidth = height * targetRatio

    return {
      sx: (width - sWidth) / 2,
      sy: 0,
      sWidth,
      sHeight: height,
    }
  }

  const sHeight = width / targetRatio

  return {
    sx: 0,
    sy: (height - sHeight) / 2,
    sWidth: width,
    sHeight,
  }
}

function resolveCaptureRect(
  width: number,
  height: number,
  cropRect: CameraCropRect | null,
  viewportAspectRatio: CameraViewportAspectRatio,
  mirrorCamera: boolean,
) {
  if (!cropRect) {
    return {
      sx: 0,
      sy: 0,
      sWidth: width,
      sHeight: height,
    }
  }

  const viewportRect = getViewportCropRect(
    width,
    height,
    viewportAspectRatio,
  )
  const normalizedWidth = Math.min(1, Math.max(0.0001, cropRect.width))
  const normalizedHeight = Math.min(1, Math.max(0.0001, cropRect.height))
  const normalizedX = Math.min(1 - normalizedWidth, Math.max(0, cropRect.x))
  const normalizedY = Math.min(1 - normalizedHeight, Math.max(0, cropRect.y))
  const effectiveX = mirrorCamera
    ? 1 - normalizedX - normalizedWidth
    : normalizedX

  return {
    sx: viewportRect.sx + effectiveX * viewportRect.sWidth,
    sy: viewportRect.sy + normalizedY * viewportRect.sHeight,
    sWidth: normalizedWidth * viewportRect.sWidth,
    sHeight: normalizedHeight * viewportRect.sHeight,
  }
}

export function useCapture({
  videoRef,
  canvasRef,
  flashRef,
  cameraReady,
  onCapture,
  onCaptureSession,
  defaultSettings,
  viewportAspectRatio,
}: UseCaptureOptions) {
  const [mode, setMode] = useState<CaptureMode>("photo")
  const [frames, setFrames] = useState<CapturedFrame[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const [settings, setSettingsState] = useState<CaptureSettings>({
    ...DEFAULT_SETTINGS,
    ...defaultSettings,
  })
  const settingsRef = useRef(settings)

  const { playTick, playPositive } = useCaptureSound()

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBurstingRef = useRef(false)
  const isRecActiveRef = useRef(false)
  const isDownRef = useRef(false)
  const sessionFramesRef = useRef<CapturedFrame[]>([])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  function triggerFlash() {
    const el = flashRef.current
    if (!el) return
    el.classList.remove("flashing")
    void el.offsetWidth
    el.classList.add("flashing")
  }

  function extractFrame(source: CaptureSource): CapturedFrame | null {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return null
    const currentSettings = settingsRef.current

    const cropRect = resolveCaptureRect(
      video.videoWidth,
      video.videoHeight,
      currentSettings.cropRect,
      viewportAspectRatio,
      currentSettings.mirrorCamera,
    )
    const outputWidth = Math.max(1, Math.round(cropRect.sWidth))
    const outputHeight = Math.max(1, Math.round(cropRect.sHeight))

    canvas.width = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    if (currentSettings.mirrorCamera) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(
      video,
      cropRect.sx,
      cropRect.sy,
      cropRect.sWidth,
      cropRect.sHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    ctx.restore()

    const frame: CapturedFrame = {
      id: crypto.randomUUID(),
      dataUrl: canvas.toDataURL("image/jpeg", 0.92),
      capturedAt: Date.now(),
      source,
    }

    return frame
  }

  function commitFrame(frame: CapturedFrame) {
    setFrames((prev) => [...prev, frame])
    setCaptureCount((n) => n + 1)
    playTick()
    triggerFlash()
    onCapture?.(frame)

    if (frame.source === "single") {
      onCaptureSession?.({
        frames: [frame],
        source: frame.source,
      })
      return
    }

    sessionFramesRef.current = [...sessionFramesRef.current, frame]
  }

  function captureOne(source: CaptureSource) {
    const frame = extractFrame(source)
    if (frame) commitFrame(frame)
  }

  function stopBurst() {
    if (!isBurstingRef.current) return
    isBurstingRef.current = false
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current)
      burstIntervalRef.current = null
    }
    setIsCapturing(false)
    playPositive()

    if (sessionFramesRef.current.length) {
      onCaptureSession?.({
        frames: sessionFramesRef.current,
        source: "burst",
      })
      sessionFramesRef.current = []
    }
  }

  function startBurst() {
    if (isBurstingRef.current) return
    isBurstingRef.current = true
    setIsCapturing(true)
    sessionFramesRef.current = []

    captureOne("burst")

    const intervalMs = 1000 / settingsRef.current.fps
    burstIntervalRef.current = setInterval(() => {
      captureOne("burst")
    }, intervalMs)
  }

  function startRec() {
    if (isRecActiveRef.current) return
    isRecActiveRef.current = true
    setIsCapturing(true)
    sessionFramesRef.current = []

    recDelayTimeoutRef.current = setTimeout(() => {
      captureOne("rec")

      const intervalMs = 1000 / settingsRef.current.fps
      burstIntervalRef.current = setInterval(() => {
        captureOne("rec")
      }, intervalMs)

      recTimeoutRef.current = setTimeout(() => {
        if (burstIntervalRef.current) {
          clearInterval(burstIntervalRef.current)
          burstIntervalRef.current = null
        }
        isRecActiveRef.current = false
        setIsCapturing(false)
        playPositive()

        if (sessionFramesRef.current.length) {
          onCaptureSession?.({
            frames: sessionFramesRef.current,
            source: "rec",
          })
          sessionFramesRef.current = []
        }
      }, settingsRef.current.recDuration)
    }, settingsRef.current.recDelay)
  }

  const onShutterDown = useCallback(() => {
    if (!cameraReady) return
    isDownRef.current = true

    if (mode === "rec") {
      startRec()
      return
    }

    holdTimerRef.current = setTimeout(() => {
      startBurst()
    }, HOLD_THRESHOLD_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady, mode])

  const onShutterUp = useCallback(() => {
    if (!isDownRef.current) return
    isDownRef.current = false

    if (mode === "rec") return

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }

    if (isBurstingRef.current) {
      stopBurst()
      return
    }

    captureOne("single")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  function setSettings(patch: Partial<CaptureSettings>) {
    setSettingsState((prev) => ({ ...prev, ...patch }))
  }

  function clear() {
    setFrames([])
    setCaptureCount(0)
    sessionFramesRef.current = []
  }

  return {
    mode,
    setMode,
    frames,
    isCapturing,
    captureCount,
    onShutterDown,
    onShutterUp,
    settings,
    setSettings,
    clear,
  }
}
