import { createFileRoute } from "@tanstack/react-router"
import ProjectOneLayout from "~/components/project/ProjectOneLayout"
import { ProjectOneProvider } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectOneRoute,
})

function ProjectOneRoute() {
  const { projectId } = Route.useParams()

  return (
    <ProjectOneProvider projectId={projectId}>
      <ProjectOneLayout />
    </ProjectOneProvider>
  )
}
