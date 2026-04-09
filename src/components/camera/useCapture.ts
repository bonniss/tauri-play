import { useCallback, useRef, useState } from "react"
import type {
  CaptureMode,
  CapturedFrame,
  CaptureSettings,
  CaptureSource,
} from "./types"
import { useCaptureSound } from "./useCaptureSound"

const HOLD_THRESHOLD_MS = 400

const DEFAULT_SETTINGS: CaptureSettings = {
  fps: 4,
  recDelay: 500,
  recDuration: 2000,
}

interface UseCaptureOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  flashRef: React.RefObject<HTMLDivElement | null>
  cameraReady: boolean
  onCapture?: (frame: CapturedFrame) => void
  defaultSettings?: Partial<CaptureSettings>
}

export function useCapture({
  videoRef,
  canvasRef,
  flashRef,
  cameraReady,
  onCapture,
  defaultSettings,
}: UseCaptureOptions) {
  const [mode, setMode] = useState<CaptureMode>("photo")
  const [frames, setFrames] = useState<CapturedFrame[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const [settings, setSettingsState] = useState<CaptureSettings>({
    ...DEFAULT_SETTINGS,
    ...defaultSettings,
  })

  const { playTick, playPositive } = useCaptureSound()

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBurstingRef = useRef(false)
  const isRecActiveRef = useRef(false)

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

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

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
  }

  function startBurst() {
    if (isBurstingRef.current) return
    isBurstingRef.current = true
    setIsCapturing(true)

    captureOne("burst")

    const intervalMs = 1000 / settings.fps
    burstIntervalRef.current = setInterval(() => {
      captureOne("burst")
    }, intervalMs)
  }

  function startRec() {
    if (isRecActiveRef.current) return
    isRecActiveRef.current = true
    setIsCapturing(true)

    recDelayTimeoutRef.current = setTimeout(() => {
      captureOne("rec")

      const intervalMs = 1000 / settings.fps
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
      }, settings.recDuration)
    }, settings.recDelay)
  }

  const onShutterDown = useCallback(() => {
    if (!cameraReady) return

    if (mode === "rec") {
      startRec()
      return
    }

    holdTimerRef.current = setTimeout(() => {
      startBurst()
    }, HOLD_THRESHOLD_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraReady, mode, settings])

  const onShutterUp = useCallback(() => {
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
