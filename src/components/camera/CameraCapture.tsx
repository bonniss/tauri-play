import { Alert, Button, Group, Paper, Text } from "@mantine/core"
import { IconCamera, IconCameraOff, IconPhoto } from "@tabler/icons-react"
import { FunctionComponent, useEffect, useRef, useState } from "react"
import { getOrCreateWorkingProjectId } from "~/lib/camera/session"
import { saveCapturedImage } from "~/lib/camera/storage"

interface CameraCaptureProps {}

const CameraCapture: FunctionComponent<CameraCaptureProps> = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<
    "idle" | "connecting" | "ready" | "error"
  >("idle")
  const [captureUrl, setCaptureUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  async function connectCamera() {
    try {
      setCameraState("connecting")
      setErrorMessage(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      })

      stopCamera()
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraState("ready")
    } catch (cause) {
      setCameraState("error")
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Failed to connect to the camera.",
      )
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop()
    })
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  function captureSingleShot() {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")
    if (!context) {
      setErrorMessage("Failed to get a 2D canvas context.")
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    setCaptureUrl(canvas.toDataURL("image/jpeg", 0.92))
  }

  async function saveSingleShot() {
    if (!captureUrl) {
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)

      const projectId = getOrCreateWorkingProjectId()
      const result = await saveCapturedImage({
        dataUrl: captureUrl,
        projectId,
      })

      setLastSavedPath(result.filePath)
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error ? cause.message : "Failed to save the captured image.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Camera</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect the webcam and capture a single image frame. Persistence comes
          next.
        </p>
      </div>

      {errorMessage ? (
        <Alert color="red" title="Camera Error" variant="light">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
        <Paper className="overflow-hidden p-3" radius="lg" withBorder>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-950">
            <video
              autoPlay
              className="h-full w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
            {cameraState !== "ready" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-sm text-white/80">
                {cameraState === "connecting"
                  ? "Connecting camera..."
                  : "Camera preview is not active."}
              </div>
            ) : null}
          </div>
        </Paper>

        <Paper className="flex flex-col gap-4 p-4" radius="lg" withBorder>
          <div className="space-y-1">
            <Text fw={600}>Capture</Text>
            <Text c="dimmed" size="sm">
              Start the camera first, then capture a single frame for review.
            </Text>
          </div>

          <Group grow>
            <Button
              leftSection={<IconCamera className="size-4" />}
              loading={cameraState === "connecting"}
              onClick={() => {
                void connectCamera()
              }}
              variant="filled"
            >
              Connect
            </Button>
            <Button
              color="gray"
              leftSection={<IconCameraOff className="size-4" />}
              onClick={stopCamera}
              variant="default"
            >
              Stop
            </Button>
          </Group>

          <Button
            disabled={cameraState !== "ready"}
            leftSection={<IconPhoto className="size-4" />}
            onClick={captureSingleShot}
            variant="light"
          >
            Take Photo
          </Button>

          <Button
            disabled={!captureUrl}
            loading={isSaving}
            onClick={() => {
              void saveSingleShot()
            }}
            variant="default"
          >
            Save Photo
          </Button>

          <div className="space-y-2">
            <Text fw={600}>Latest Shot</Text>
            <div className="overflow-hidden rounded-xl border border-black/5 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
              {captureUrl ? (
                <img
                  alt="Latest capture"
                  className="aspect-video w-full object-cover"
                  src={captureUrl}
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-zinc-500 dark:text-zinc-500">
                  No shot captured yet.
                </div>
              )}
            </div>
            {lastSavedPath ? (
              <Text c="dimmed" size="sm">
                Saved to `AppData/{lastSavedPath}`
              </Text>
            ) : null}
          </div>
        </Paper>
      </div>

      <canvas className="hidden" ref={canvasRef} />
    </div>
  )
}

export default CameraCapture
