import { Paper, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId/label/")({
  component: ProjectLabelPage,
})

function ProjectLabelPage() {
  const { classes, samples } = useProjectOne()

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Label</h2>
        <Text c="dimmed" size="sm">
          This project has {classes.length} classes and {samples.length}{" "}
          samples.
        </Text>
      </div>
    </Paper>
  )
}
