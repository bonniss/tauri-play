import { Paper, Text } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectHomePage,
})

function ProjectHomePage() {
  const { projectQuery } = useProjectOne()
  const data = projectQuery.data!

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          {data.project.name}
        </h2>
        <Text c="dimmed" size="sm">
          Open the label step to create classes and collect samples.
        </Text>
      </div>
    </Paper>
  )
}
