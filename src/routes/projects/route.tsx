import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/projects")({
  component: ProjectOneRoot,
})

function ProjectOneRoot() {
  return (
    <>
      <Outlet />
    </>
  )
}
