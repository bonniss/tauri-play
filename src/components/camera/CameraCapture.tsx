import { useRef, type FunctionComponent } from 'react'
import { useCamera } from './useCamera'
import { useCapture } from './useCapture'
import type {
  CameraCaptureContext,
  CameraViewportAspectRatio,
  CapturedFrame,
  CaptureSession,
  CaptureSettings,
} from './types'

interface CameraCaptureProps {
  aspectRatio?: CameraViewportAspectRatio
  children: (context: CameraCaptureContext) => React.ReactNode
  defaultSettings?: Partial<CaptureSettings>
  onCapture?: (frame: CapturedFrame) => void
  onCaptureSession?: (session: CaptureSession) => void
}

const CameraCapture: FunctionComponent<CameraCaptureProps> = ({
  aspectRatio = '16:9',
  children,
  defaultSettings,
  onCapture,
  onCaptureSession,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const { videoRef, cameraState, error, connect, disconnect, devices, activeDeviceId } = useCamera()

  const {
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
  } = useCapture({
    videoRef,
    canvasRef,
    flashRef,
    cameraReady: cameraState === 'ready',
    onCapture,
    onCaptureSession,
    defaultSettings,
    viewportAspectRatio: aspectRatio,
  })

  const context: CameraCaptureContext = {
    cameraState,
    error,
    connect,
    disconnect,
    videoRef,
    flashRef,
    devices,
    activeDeviceId,
    mode,
    setMode,
    isCapturing,
    captureCount,
    onShutterDown,
    onShutterUp,
    settings,
    setSettings,
    frames,
    clear,
  }

  return (
    <>
      {children(context)}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}

export default CameraCapture
export type { CameraCaptureContext, CapturedFrame, CaptureSession, CaptureSettings }
