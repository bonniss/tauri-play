import { createFileRoute } from "@tanstack/react-router"
import CameraUI from "~/components/camera/CameraUI"

export const Route = createFileRoute("/camera")({
  component: CameraPage,
})

function CameraPage() {
  return <CameraUI onCapture={(frame) => console.log(frame)} />
}

export default CameraPage
