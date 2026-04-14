import { Button } from "@mantine/core"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import AppSettings from "./AppSettings"

interface AppHeaderProps {}

const AppHeader: FunctionComponent<AppHeaderProps> = () => {
  return (
    <header className="py-4 flex items-center justify-between gap-4">
      <div className="left-section flex items-center gap-2">
        <Button component={Link} size="compact-sm" to="/" variant="subtle">
          Home
        </Button>
        <Button
          component={Link}
          size="compact-sm"
          to="/camera"
          variant="subtle"
        >
          Camera
        </Button>
        <Button
          component={Link}
          size="compact-sm"
          to="/ml-lab"
          variant="subtle"
        >
          ML Lab
        </Button>
      </div>
      <AppSettings />
    </header>
  )
}

export default AppHeader
