export type CameraState = "idle" | "connecting" | "ready" | "error"
export type CameraViewportAspectRatio = "16:9" | "4:3" | "1:1"

export type CaptureMode = "photo" | "rec"

export type CaptureSource = "single" | "burst" | "rec"

export interface CameraCropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CapturedFrame {
  id: string
  dataUrl: string
  capturedAt: number
  source: CaptureSource
}

export interface CaptureSession {
  frames: CapturedFrame[]
  source: CaptureSource
}

export interface CaptureSettings {
  cropRect: CameraCropRect | null
  fps: number
  mirrorCamera: boolean
  recDelay: number
  recDuration: number
}

export interface CameraCaptureContext {
  // camera lifecycle
  cameraState: CameraState
  error: string | null
  connect: (deviceId?: string) => void
  disconnect: () => void
  videoRef: React.RefObject<HTMLVideoElement | null>
  flashRef: React.RefObject<HTMLDivElement | null>

  // device selection
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null

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
