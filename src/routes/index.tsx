import {
  Alert,
  Badge,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { listProjects } from "~/lib/db/projects"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const projectsQuery = useQuery({
    queryKey: ["projects", deferredSearch],
    queryFn: () => listProjects(deferredSearch),
  })

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <Text c="dimmed" size="sm">
            Browse image classification projects and search by name.
          </Text>
        </div>
        <TextInput
          className="w-full sm:max-w-sm"
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Search projects by name"
          value={search}
        />
      </div>

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="sm" />
        </div>
      ) : null}

      {projectsQuery.error ? (
        <Alert color="red" title="Failed to load projects" variant="light">
          {projectsQuery.error instanceof Error
            ? projectsQuery.error.message
            : "Unknown error while loading projects."}
        </Alert>
      ) : null}

      {projectsQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.map((project) => (
            <Paper className="p-5" key={project.id} radius="lg" withBorder>
              <Stack gap="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold leading-tight">
                      {project.name}
                    </h2>
                    <Text c="dimmed" size="sm">
                      {project.description || "No description yet."}
                    </Text>
                  </div>
                  <Badge color={project.hasModel ? "green" : "gray"} variant="light">
                    {project.hasModel ? "Model ready" : "No model"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Classes" value={project.classCount} />
                  <Stat label="Samples" value={project.sampleCount} />
                  <Stat label="Task" value={project.taskType} />
                  <Stat
                    label="Updated"
                    value={new Date(project.updatedAt).toLocaleDateString()}
                  />
                </div>
              </Stack>
            </Paper>
          ))}
        </div>
      ) : null}

      {!projectsQuery.isLoading && !projectsQuery.error && !projectsQuery.data?.length ? (
        <Paper className="p-8 text-center" radius="lg" withBorder>
          <Stack gap="xs">
            <Text fw={600}>
              {deferredSearch
                ? "No projects match this search."
                : "No projects yet."}
            </Text>
            <Text c="dimmed" size="sm">
              {deferredSearch
                ? "Try a different project name."
                : "Create the first project to start collecting labels and samples."}
            </Text>
          </Stack>
        </Paper>
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-black/5 px-3 py-3 dark:border-white/10">
      <Text c="dimmed" size="xs">
        {label}
      </Text>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  )
}

export default HomePage
