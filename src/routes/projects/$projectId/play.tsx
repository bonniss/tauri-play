import { Paper, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId/play")({
  component: ProjectPlayPage,
})

function ProjectPlayPage() {
  const { projectQuery } = useProjectOne()
  const data = projectQuery.data!

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Play</h2>
        <Text c="dimmed" size="sm">
          Live inference will use the current model for {data.project.name}.
        </Text>
      </div>
    </Paper>
  )
}
