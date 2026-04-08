import { createFileRoute } from "@tanstack/react-router"
import CameraCapture from "~/components/camera/CameraCapture"

export const Route = createFileRoute("/camera")({
  component: CameraPage,
})

function CameraPage() {
  return <CameraCapture />
}

export default CameraPage
