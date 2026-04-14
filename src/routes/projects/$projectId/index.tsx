import { Navigate, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectIndexRedirect,
})

function ProjectIndexRedirect() {
  const { projectId } = Route.useParams()

  return (
    <Navigate
      params={{ projectId } as never}
      to="/projects/$projectId/label"
    />
  )
}
