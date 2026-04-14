import { useRef, type FunctionComponent } from 'react'
import { useCamera } from './useCamera'
import { useCapture } from './useCapture'
import type { CameraCaptureContext, CapturedFrame, CaptureSettings } from './types'

interface CameraCaptureProps {
  children: (context: CameraCaptureContext) => React.ReactNode
  defaultSettings?: Partial<CaptureSettings>
  onCapture?: (frame: CapturedFrame) => void
}

const CameraCapture: FunctionComponent<CameraCaptureProps> = ({
  children,
  defaultSettings,
  onCapture,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)

  const { videoRef, cameraState, error, connect, disconnect } = useCamera()

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
    defaultSettings,
  })

  const context: CameraCaptureContext = {
    cameraState,
    error,
    connect,
    disconnect,
    videoRef,
    flashRef,
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
export type { CameraCaptureContext, CapturedFrame, CaptureSettings }
