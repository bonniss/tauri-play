import { Paper, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId/train")({
  component: ProjectTrainPage,
})

function ProjectTrainPage() {
  const { projectQuery } = useProjectOne()
  const data = projectQuery.data!

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
        <Text c="dimmed" size="sm">
          Current dataset: {data.classes.length} classes, {data.samples.length} samples.
        </Text>
      </div>
    </Paper>
  )
}
