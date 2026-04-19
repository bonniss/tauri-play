import { useCallback, useEffect, useRef, useState } from "react"
import type { CameraState } from "./types"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)

  // attach stream to video element after state becomes 'ready'
  // runs after React commits render, so videoRef is guaranteed attached
  useEffect(() => {
    if (cameraState !== "ready") return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    const doPlay = () => {
      void video.play().catch((cause) => {
        setCameraState("error")
        setError(
          cause instanceof Error
            ? cause.message
            : "Failed to start video playback.",
        )
      })
    }

    video.srcObject = stream

    // wait for metadata before playing — fixes black screen on macOS/Windows WebView
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      doPlay()
    } else {
      video.addEventListener("loadedmetadata", doPlay, { once: true })
      return () => video.removeEventListener("loadedmetadata", doPlay)
    }
  }, [cameraState])

  const disconnect = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraState("idle")
    setError(null)
    setActiveDeviceId(null)
  }, [])

  const connect = useCallback(async (deviceId?: string) => {
    try {
      setCameraState("connecting")
      setError(null)

      const videoConstraint: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : {}

      const stream = await navigator.mediaDevices?.getUserMedia({
        video: videoConstraint,
        audio: false,
      })

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = stream

      // after getting stream we have permission — enumerate devices now
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      setDevices(allDevices.filter((d) => d.kind === "videoinput"))

      const activeTrack = stream.getVideoTracks()[0]
      setActiveDeviceId(activeTrack?.getSettings().deviceId ?? null)

      // triggers useEffect above which attaches stream after render
      setCameraState("ready")
    } catch (cause) {
      setCameraState("error")
      setError(
        cause instanceof Error ? cause.message : "Failed to connect to camera.",
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    videoRef,
    cameraState,
    error,
    devices,
    activeDeviceId,
    connect,
    disconnect,
  }
}
