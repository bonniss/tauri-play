import { useQuery } from "@tanstack/react-query"
import { createProvider } from "react-easy-provider"
import {
  getProjectWorkspace,
  type ProjectWorkspace,
} from "~/lib/db/domain/projects"

export const [useProjectOne, ProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId

    if (!projectId) {
      throw new Error("Missing projectId.")
    }

    const { data, isLoading, isFetching, error, isError, refetch } =
      useQuery<ProjectWorkspace>({
        queryKey: ["project-workspace", projectId],
        queryFn: () => getProjectWorkspace(projectId),
      })

    if (isError) {
      throw error
    }

    const classes = data?.classes ?? []
    const samples = data?.samples ?? []
    const project = data?.project
    const projectName = project?.name ?? ""
    const projectStatus = project?.status

    const totalClasses = classes.length
    const totalSamples = samples.length
    const isEmptyClass = totalClasses === 0
    const isReadyForTrain = totalClasses > 1

    return {
      projectId,
      projectName,
      projectStatus,
      project,
      classes,
      samples,
      totalClasses,
      totalSamples,
      isEmptyClass,
      isReadyForTrain,

      // react query state
      refetch,
      isLoading,
      isFetching,
    }
  },
)
