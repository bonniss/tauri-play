import { createFileRoute } from "@tanstack/react-router"
import { CapturedFrame } from "~/components/camera/CameraCapture"
import CameraUI from "~/components/camera/CameraUI"
import { getOrCreateWorkingProjectId } from "~/lib/camera/session"
import { saveCapturedImage } from "~/lib/camera/storage"

export const Route = createFileRoute("/camera")({
  component: CameraPage,
})

function CameraPage() {
  const projectId = getOrCreateWorkingProjectId()

  async function handleCapture(frame: CapturedFrame) {
    try {
      await saveCapturedImage({
        dataUrl: frame.dataUrl,
        projectId,
      })
    } catch (e) {
      console.error('save failed', e)
    }
  }

  return <CameraUI onCapture={handleCapture} />
}

export default CameraPage
