import { Button, type ButtonProps, type ElementProps } from "@mantine/core"
import { IconCamera, IconUpload } from "@tabler/icons-react"
import { FunctionComponent, ReactNode } from "react"

interface ProjectActionButtonProps
  extends ButtonProps,
    ElementProps<"button", keyof ButtonProps> {
  action: "camera" | "upload"
  children: ReactNode
}

const actionDefaults: Record<
  ProjectActionButtonProps["action"],
  {
    color: ButtonProps["color"]
    leftSection: ReactNode
    variant: ButtonProps["variant"]
  }
> = {
  camera: {
    color: "cyan",
    leftSection: <IconCamera className="size-4" />,
    variant: "light",
  },
  upload: {
    color: "orange",
    leftSection: <IconUpload className="size-4" />,
    variant: "light",
  },
}

const ProjectActionButton: FunctionComponent<ProjectActionButtonProps> = ({
  action,
  children,
  color,
  leftSection,
  variant,
  ...props
}) => {
  const defaults = actionDefaults[action]

  return (
    <Button
      color={color ?? defaults.color}
      leftSection={leftSection ?? defaults.leftSection}
      variant={variant ?? defaults.variant}
      {...props}
    >
      {children}
    </Button>
  )
}

export default ProjectActionButton
