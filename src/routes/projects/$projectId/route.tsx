import { Center, Loader } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"
import { ClassColorCycleContext } from "~/components/project/ClassColorBadge"
import ProjectOneLayout from "~/components/project/ProjectOneLayout"
import {
  ProjectOneProvider,
  useProjectOne,
} from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectOneRoute,
})

function ProjectOneRoute() {
  const { projectId } = Route.useParams()

  return (
    <ProjectOneProvider defaultValue={{ projectId }}>
      <Inner />
    </ProjectOneProvider>
  )
}

const Inner = () => {
  const { isLoading, cycleClassColor } = useProjectOne()

  if (isLoading) {
    return (
      <Center className="py-20">
        <Loader />
      </Center>
    )
  }

  return (
    <ClassColorCycleContext.Provider value={cycleClassColor}>
      <ProjectOneLayout />
    </ClassColorCycleContext.Provider>
  )
}
