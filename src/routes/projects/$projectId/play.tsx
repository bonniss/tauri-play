import { Alert, Button, Group, Paper, Stack, Text } from "@mantine/core"
import { IconPlayerPlay } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Form, defineConfig } from "~/components/form"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import { getProjectModel } from "~/lib/db/domain/models"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"

export const Route = createFileRoute("/projects/$projectId/play")({
  component: ProjectPlayPage,
})

const playSettingsForm = defineConfig<ProjectPlaySettingsFormValues>({
  mode: {
    type: "radio",
    label: "Mode",
    props: {
      options: [
        {
          label: "Upload",
          value: "upload",
        },
        {
          label: "Camera",
          value: "camera",
        },
      ],
    },
  },
  autoPredictOnUpload: {
    type: "switch",
    label: "Auto predict on upload",
  },
  showConfidenceScores: {
    type: "switch",
    label: "Show confidence scores",
  },
  showAllClasses: {
    type: "switch",
    label: "Show all classes",
  },
  topK: {
    type: "numeric",
    label: "Top results",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  confidenceThreshold: {
    type: "numeric",
    label: "Confidence threshold",
    props: {
      allowDecimal: true,
      decimalScale: 2,
      min: 0,
      max: 1,
      step: 0.05,
    },
  },
})

function ProjectPlayPage() {
  const {
    applyPlaySettings,
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    playSettings,
    projectDescription,
    projectId,
    projectName,
  } = useProjectOne()
  const navigate = useNavigate()
  const projectModelQuery = useQuery({
    queryKey: ["project-model", projectId],
    queryFn: () => getProjectModel(projectId),
  })

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <Stack gap="lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Play</h2>
          <Text c="dimmed" size="sm">
            Configure how people will experience {projectName}, then launch the
            project demo page.
          </Text>
          {projectDescription ? (
            <Text c="dimmed" size="sm">
              {projectDescription}
            </Text>
          ) : null}
        </div>

        {!projectModelQuery.data ? (
          <Alert color="yellow" variant="light">
            Train this project first before launching the play page.
          </Alert>
        ) : null}

        <Form
          key={JSON.stringify(getPlaySettingsFormValues())}
          config={playSettingsForm}
          defaultValues={getPlaySettingsFormValues()}
          onSubmit={async (values) => {
            await applyPlaySettings(values)
            await navigate({
              to: "/p/$projectId",
              params: { projectId },
            })
          }}
          renderRoot={({ children, onSubmit }) => (
            <form className="space-y-4" onSubmit={onSubmit}>
              {children}
              <Group justify="space-between">
                <Text c="dimmed" size="sm">
                  Current mode: {playSettings.mode}
                </Text>
                <Button
                  disabled={!projectModelQuery.data}
                  leftSection={<IconPlayerPlay className="size-4" />}
                  loading={isApplyingPlaySettings}
                  type="submit"
                >
                  Start
                </Button>
              </Group>
            </form>
          )}
        />
      </Stack>
    </Paper>
  )
}
