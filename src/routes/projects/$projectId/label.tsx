import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/label')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/label"!</div>
}
