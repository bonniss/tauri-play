import { Alert, Loader, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { createProvider } from "react-easy-provider"
import { FunctionComponent, PropsWithChildren } from "react"
import {
  getProjectWorkspace,
  type ProjectWorkspace,
} from "~/lib/db/domain/projects"

interface ProjectOneProviderProps extends PropsWithChildren {
  projectId: string
}

const [useProjectOne, InternalProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId

    if (!projectId) {
      throw new Error("ProjectOneProvider requires a projectId.")
    }

    const projectQuery = useQuery<ProjectWorkspace>({
      queryKey: ["project-workspace", projectId],
      queryFn: () => getProjectWorkspace(projectId),
    })

    return {
      projectId,
      projectQuery,
    }
  },
)

const ProjectOneProvider: FunctionComponent<ProjectOneProviderProps> = ({
  children,
  projectId,
}) => {
  return (
    <InternalProjectOneProvider defaultValue={{ projectId }}>
      <ProjectOneGate>{children}</ProjectOneGate>
    </InternalProjectOneProvider>
  )
}

function ProjectOneGate({ children }: PropsWithChildren) {
  const { projectQuery } = useProjectOne()

  if (projectQuery.isLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <Loader size="sm" />
      </div>
    )
  }

  if (projectQuery.error) {
    return (
      <Alert color="red" title="Failed to load project" variant="light">
        {projectQuery.error instanceof Error
          ? projectQuery.error.message
          : "Unknown error while loading the project."}
      </Alert>
    )
  }

  if (!projectQuery.data) {
    return (
      <div className="py-10">
        <Text c="dimmed" size="sm">
          Project data is unavailable.
        </Text>
      </div>
    )
  }

  return <>{children}</>
}

export { ProjectOneProvider, useProjectOne }
