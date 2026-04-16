import { Button } from "@mantine/core"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import AppSettings from "./AppSettings"

interface AppHeaderProps {}

const AppHeader: FunctionComponent<AppHeaderProps> = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[60px] bg-transparent">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-4">
        <div className="flex items-center gap-2">
          <Button component={Link} size="compact-sm" to="/" variant="subtle">
            Home
          </Button>
          <Button
            component={Link}
            size="compact-sm"
            to="/projects"
            variant="subtle"
          >
            Projects
          </Button>
          <AppSettings />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
