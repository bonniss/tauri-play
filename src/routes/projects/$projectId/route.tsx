import { Badge, Button, Paper, Text } from "@mantine/core"
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import { ProjectOneProvider, useProjectOne } from "~/components/project/ProjectOneProvider"

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectOneRoute,
})

function ProjectOneRoute() {
  const { projectId } = Route.useParams()

  return (
    <ProjectOneProvider projectId={projectId}>
      <ProjectOneLayout />
    </ProjectOneProvider>
  )
}

function ProjectOneLayout() {
  const { projectId, projectQuery } = useProjectOne()
  const data = projectQuery.data!
  const totalImages = data.samples.length

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-6 py-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Paper className="flex h-fit flex-col gap-6 p-4" radius="xl" withBorder>
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold leading-tight">
                {data.project.name}
              </h1>
              <Text c="dimmed" size="sm">
                {data.project.description || "Project workspace"}
              </Text>
            </div>
            <Badge
              color={data.project.status === "active" ? "green" : "gray"}
              variant="light"
            >
              {data.project.status}
            </Badge>
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
          {data.classes.map((projectClass) => (
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
