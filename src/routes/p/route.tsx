import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/p")({
  component: PlayerLayoutRoute,
})

function PlayerLayoutRoute() {
  return <Outlet />
}
