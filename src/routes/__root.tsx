import { createRootRoute, Outlet } from "@tanstack/react-router"
import DefaultLayout from "../components/layout/DefaultLayout"

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  )
}
