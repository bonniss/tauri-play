import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/label/$classId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/label/$classId"!</div>
}
