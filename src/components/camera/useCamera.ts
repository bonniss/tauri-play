import { useCallback, useEffect, useRef, useState } from "react"
import type { CameraState } from "./types"

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>("idle")
  const [error, setError] = useState<string | null>(null)

  // attach stream to video element after state becomes 'ready'
  // runs after React commits render, so videoRef is guaranteed attached
  useEffect(() => {
    if (cameraState !== "ready") return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    video.srcObject = stream
    void video.play().catch((cause) => {
      setCameraState("error")
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to start video playback.",
      )
    })
  }, [cameraState])

  const disconnect = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraState("idle")
    setError(null)
  }, [])

  const getMediaDevices = navigator.mediaDevices?.enumerateDevices

  const connect = useCallback(async () => {
    try {
      setCameraState("connecting")
      setError(null)

      const stream = await navigator.mediaDevices?.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = stream

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
    getMediaDevices,
    connect,
    disconnect,
  }
}
