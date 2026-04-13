import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/train')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/projects/$projectId/train"!</div>
}
