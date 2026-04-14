import { Button } from "@mantine/core"
import { IconBellBolt } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
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
      console.error("save failed", e)
    }
  }

  return (
    <>
      <CameraUI onCapture={handleCapture} />
      <Button
        onClick={() => {
          toast.info('duytrung', {
            description: "This is a description",
            icon: <IconBellBolt />,
            position: 'top-center',
            action: 'success',
          })
        }}
      >
        Test toast
      </Button>
    </>
  )
}

export default CameraPage
