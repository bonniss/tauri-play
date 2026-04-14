import { NavLink, Text } from "@mantine/core"
import {
  IconBrain,
  IconCircleDot,
  IconFolder,
  IconPencil,
  IconPlayerPlay,
} from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { FunctionComponent, ReactNode } from "react"
import ContentEditable from "~/components/headless/ContentEditable"
import { type ProjectWorkspace, updateProject } from "~/lib/db/domain/projects"
import { useProjectOne } from "./ProjectOneProvider"

interface ProjectOneLayoutProps {}

const ProjectOneLayout: FunctionComponent<ProjectOneLayoutProps> = () => {
  const { projectId, classes, samples, project, projectName, projectStatus } =
    useProjectOne()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const queryClient = useQueryClient()
  const totalImages = samples.length

  const updateProjectMutation = useMutation({
    mutationFn: async ({
      description,
      name,
    }: {
      description?: string | null
      name?: string
    }) => {
      await updateProject({
        projectId,
        description,
        name,
      })
    },
    onError: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["project-workspace", projectId],
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  async function saveProjectField(next: {
    description?: string | null
    name?: string
  }) {
    const nextName = next.name?.trim()
    const nextDescription =
      next.description !== undefined
        ? next.description?.trim() || null
        : undefined

    if (next.name !== undefined && !nextName) {
      await queryClient.invalidateQueries({
        queryKey: ["project-workspace", projectId],
      })
      return
    }

    if (
      nextName === projectName &&
      nextDescription === (project?.description ?? null)
    ) {
      return
    }

    queryClient.setQueryData<ProjectWorkspace>(
      ["project-workspace", projectId],
      (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          project: {
            ...current.project,
            name: nextName ?? current.project?.name,
            description:
              nextDescription !== undefined
                ? nextDescription
                : current.project?.description,
            updatedAt: new Date().toISOString(),
          },
        }
      },
    )

    await updateProjectMutation.mutateAsync({
      description: nextDescription,
      name: nextName,
    })
  }

  return (
    <section className="min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8">
      <aside className="lg:flex lg:flex-col lg:w-80 overflow-y-auto border-r border-zinc-200 dark:border-zinc-600 px-4 py-2 bg-gray-50 dark:bg-gray-800/80 rounded-sm">
        <div className="space-y-2">
          <ContentEditable
            as="h1"
            aria-label="Project name"
            className="min-w-0 rounded-md px-2 py-1 text-xl font-semibold leading-tight text-zinc-950 outline-none transition-colors dark:text-zinc-50"
            focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
            onBlur={async (value) => {
              await saveProjectField({ name: value })
            }}
            value={projectName}
          />
          <ContentEditable
            as="p"
            aria-label="Project description"
            className="min-w-0 rounded-md px-2 py-1 text-sm leading-6 text-zinc-500 outline-none transition-colors dark:text-zinc-400"
            focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
            multiline
            onBlur={async (value) => {
              await saveProjectField({ description: value })
            }}
            placeholder="Add project description"
            value={project?.description ?? ""}
          />
        </div>

        <nav className="mt-8 flex flex-1 flex-col">
          <div className="space-y-1">
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/label`}
              icon={IconPencil}
              label="Label"
              projectId={projectId}
              to="/projects/$projectId/label"
            />
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/train`}
              icon={IconBrain}
              label="Train"
              projectId={projectId}
              to="/projects/$projectId/train"
            />
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/play`}
              icon={IconPlayerPlay}
              label="Play"
              projectId={projectId}
              to="/projects/$projectId/play"
            />
          </div>

          <div className="mt-8">
            <Text c="dimmed" fw={600} size="xs" tt="uppercase">
              Dataset
            </Text>
            <div className="mt-3 space-y-1">
              <SidebarDatasetItem
                count={totalImages}
                label="All Images"
                leading={<IconFolder className="size-4" stroke={1.8} />}
              />
              {classes.map((projectClass) => (
                <SidebarDatasetItem
                  count={projectClass.sampleCount}
                  key={projectClass.id}
                  label={projectClass.name}
                  leading={<IconCircleDot className="size-3.5" stroke={2} />}
                />
              ))}
            </div>
          </div>
        </nav>
      </aside>

      <div className="mx-auto w-full">
        <Outlet />
      </div>
    </section>
  )
}

function ProjectNavItem({
  current,
  icon: Icon,
  label,
  projectId,
  to,
}: {
  current: boolean
  icon: typeof IconPencil
  label: string
  projectId: string
  to:
    | "/projects/$projectId"
    | "/projects/$projectId/label"
    | "/projects/$projectId/train"
    | "/projects/$projectId/play"
}) {
  return (
    <NavLink
      variant="light"
      active={current}
      className="rounded-md"
      component={Link}
      label={label}
      leftSection={<Icon className="size-4" stroke={1.8} />}
      params={{ projectId } as never}
      to={to}
    />
  )
}

function SidebarDatasetItem({
  count,
  label,
  leading,
}: {
  count: number
  label: string
  leading: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300">
      <div className="flex size-6 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500">
        {leading}
      </div>
      <div className="min-w-0 flex-1 truncate">
        <Text fw={500} size="sm">
          {label}
        </Text>
      </div>
      <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
        {count}
      </div>
    </div>
  )
}

export default ProjectOneLayout
