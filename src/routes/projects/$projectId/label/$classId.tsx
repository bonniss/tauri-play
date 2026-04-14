import { Group, Paper, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import UploadSamplesButton from "~/components/project/UploadSamplesButton"
import { useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId/label/$classId")({
  component: ProjectLabelClassPage,
})

function ProjectLabelClassPage() {
  const { classId } = Route.useParams()
  const { classes, samples } = useProjectOne()
  const currentClass = classes.find((item) => item.id === classId)
  const classSamples = samples.filter((item) => item.classId === classId)

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              {currentClass?.name ?? "Class"}
            </h2>
            <Text c="dimmed" size="sm">
              {classSamples.length} samples in this class.
            </Text>
          </div>
          <Group>
            <UploadSamplesButton buttonLabel="Upload" classId={classId} />
          </Group>
        </div>
      </div>
    </Paper>
  )
}
