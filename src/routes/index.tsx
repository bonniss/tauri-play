import {
  Alert,
  Badge,
  Button,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { startTransition, useDeferredValue, useState } from "react"
import { Form, defineConfig } from "~/components/form"
import {
  createProject,
  deleteProject,
  listProjects,
} from "~/lib/db/domain/projects"
import { generateRandomProjectName } from "~/lib/project/name"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const createProjectForm = defineConfig<{
  description: string
  name: string
}>({
  name: {
    type: "text",
    label: "Name",
    rules: {
      required: true,
    },
    props: {
      autoFocus: true,
    },
  },
  description: {
    type: "longText",
    label: "Description",
  },
})

function HomePage() {
  const [search, setSearch] = useState("")
  const [projectNameSeed, setProjectNameSeed] = useState(
    generateRandomProjectName(),
  )
  const [createProjectOpened, createProjectHandlers] = useDisclosure(false)
  const deferredSearch = useDeferredValue(search)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const projectsQuery = useQuery({
    queryKey: ["projects", deferredSearch],
    queryFn: () => listProjects({ search: deferredSearch }),
  })
  const createProjectMutation = useMutation({
    mutationFn: async ({
      description,
      name,
    }: {
      description: string
      name: string
    }) => {
      return createProject({
        description: description.trim() || null,
        name,
        status: "draft",
      })
    },
    onSuccess: async (projectId) => {
      createProjectHandlers.close()
      await queryClient.invalidateQueries({ queryKey: ["projects"] })

      startTransition(() => {
        void navigate({
          to: "/projects/$projectId/label",
          params: { projectId },
        })
      })
    },
  })
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await deleteProject(projectId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
      <Modal
        onClose={createProjectHandlers.close}
        opened={createProjectOpened}
        withCloseButton={false}
      >
        <Form
          renderRoot={({ children, onSubmit }) => (
            <form className="space-y-3" onSubmit={onSubmit}>
              {children}
            </form>
          )}
          config={createProjectForm}
          defaultValues={{
            description: "",
            name: projectNameSeed,
          }}
          onSubmit={async (values) => {
            await createProjectMutation.mutateAsync(values)
          }}
        >
          <div className="mt-4 flex justify-end gap-3">
            <Button
              onClick={createProjectHandlers.close}
              type="button"
              variant="default"
            >
              Cancel
            </Button>
            <Button loading={createProjectMutation.isPending} type="submit">
              Create Project
            </Button>
          </div>
        </Form>
      </Modal>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            className="w-full sm:w-48"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search projects by name"
            value={search}
          />
          <Button
            onClick={() => {
              setProjectNameSeed(generateRandomProjectName())
              createProjectHandlers.open()
            }}
          >
            New Project
          </Button>
        </div>
      </div>

      {createProjectMutation.error ? (
        <Alert color="red" title="Failed to create project" variant="light">
          {createProjectMutation.error instanceof Error
            ? createProjectMutation.error.message
            : "Unknown error while creating the project."}
        </Alert>
      ) : null}

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
                  <Badge
                    color={project.hasModel ? "green" : "gray"}
                    variant="light"
                  >
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

                <Button
                  component={Link}
                  params={{ projectId: project.id } as never}
                  to="/projects/$projectId/label"
                  variant="light"
                >
                  Open
                </Button>
                {import.meta.env.DEV ? (
                  <Button
                    color="red"
                    loading={
                      deleteProjectMutation.isPending &&
                      deleteProjectMutation.variables === project.id
                    }
                    onClick={() => {
                      deleteProjectMutation.mutate(project.id)
                    }}
                    variant="light"
                  >
                    Delete
                  </Button>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </div>
      ) : null}

      {!projectsQuery.isLoading &&
      !projectsQuery.error &&
      !projectsQuery.data?.length ? (
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
