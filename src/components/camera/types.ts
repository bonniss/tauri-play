export type CameraState = "idle" | "connecting" | "ready" | "error"

export type CaptureMode = "photo" | "rec"

export type CaptureSource = "single" | "burst" | "rec"

export interface CapturedFrame {
  id: string
  dataUrl: string
  capturedAt: number
  source: CaptureSource
}

export interface CaptureSettings {
  fps: number
  recDelay: number
  recDuration: number
}

export interface CameraCaptureContext {
  // camera lifecycle
  cameraState: CameraState
  error: string | null
  connect: () => void
  disconnect: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  flashRef: React.RefObject<HTMLDivElement | null>

  // mode
  mode: CaptureMode
  setMode: (mode: CaptureMode) => void

  // capture
  isCapturing: boolean
  captureCount: number
  onShutterDown: () => void
  onShutterUp: () => void

  // settings
  settings: CaptureSettings
  setSettings: (patch: Partial<CaptureSettings>) => void

  // frames
  frames: CapturedFrame[]
  clear: () => void
}
