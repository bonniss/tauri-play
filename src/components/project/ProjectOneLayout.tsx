import { Badge, Button, Paper, Text } from "@mantine/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, Outlet } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import ContentEditable from "~/components/headless/ContentEditable"
import { type ProjectWorkspace, updateProject } from "~/lib/db/domain/projects"
import { useProjectOne } from "./ProjectOneProvider"

interface ProjectOneLayoutProps {}

const ProjectOneLayout: FunctionComponent<ProjectOneLayoutProps> = () => {
  const { projectId, classes, samples, project, projectName, projectStatus } =
    useProjectOne()
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
    <section className="mx-auto grid w-full max-w-7xl gap-6 py-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Paper className="flex h-fit flex-col gap-6 p-4" radius="xl" withBorder>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <ContentEditable
                as="h2"
                aria-label="Project name"
                className="min-w-0 rounded-md px-2 py-1 text-xl font-semibold leading-tight outline-none transition-colors"
                focusedClassName="dark:bg-zinc-800 dark:text-zinc-100 bg-zinc-100 ring-1 ring-zinc-300"
                onBlur={async (value) => {
                  await saveProjectField({ name: value })
                }}
                value={projectName}
              />
              <ContentEditable
                aria-label="Project description"
                className="min-w-0 rounded-md px-2 py-1 text-sm text-zinc-500 outline-none transition-colors hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/70"
                focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                multiline
                onBlur={async (value) => {
                  await saveProjectField({ description: value })
                }}
                placeholder="Add project description"
                value={project?.description ?? ""}
              />
            </div>
            {/* <Badge
              color={projectStatus === "active" ? "green" : "gray"}
              variant="light"
            >
              {projectStatus}
            </Badge> */}
          </div>
        </div>

        <nav className="space-y-2">
          <ProjectNavButton
            label="Label"
            projectId={projectId}
            to="/projects/$projectId/label"
          />
          <ProjectNavButton
            label="Train"
            projectId={projectId}
            to="/projects/$projectId/train"
          />
          <ProjectNavButton
            label="Play"
            projectId={projectId}
            to="/projects/$projectId/play"
          />
        </nav>

        <div className="space-y-3">
          <SidebarStat label="All Images" value={totalImages} />
          {classes.map((projectClass) => (
            <SidebarStat
              key={projectClass.id}
              label={projectClass.name}
              value={projectClass.sampleCount}
            />
          ))}
        </div>
      </Paper>

      <div className="min-w-0">
        <Outlet />
      </div>
    </section>
  )
}

function ProjectNavButton({
  label,
  projectId,
  to,
}: {
  label: string
  projectId: string
  to:
    | "/projects/$projectId"
    | "/projects/$projectId/label"
    | "/projects/$projectId/train"
    | "/projects/$projectId/play"
}) {
  return (
    <Button
      className="justify-start"
      component={Link}
      fullWidth
      params={{ projectId } as never}
      to={to}
      variant="subtle"
    >
      {label}
    </Button>
  )
}

function SidebarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Text size="sm">{label}</Text>
        <Text c="dimmed" size="sm">
          {value}
        </Text>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-white/10" />
    </div>
  )
}

export default ProjectOneLayout
