import { Button, Group, Paper, Popover, Text } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Form, defineConfig } from "~/components/form"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import { ProjectTrainSettingsFormValues } from "~/lib/project/settings"

export const Route = createFileRoute("/projects/$projectId/train")({
  component: ProjectTrainPage,
})

const trainSettingsForm = defineConfig<ProjectTrainSettingsFormValues>({
  validationSplit: {
    type: "numeric",
    label: "Validation split",
    props: {
      allowDecimal: true,
      decimalScale: 2,
      min: 0.05,
      max: 0.5,
      step: 0.05,
    },
  },
  epochs: {
    type: "numeric",
    label: "Epochs",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  batchSize: {
    type: "numeric",
    label: "Batch size",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  learningRate: {
    type: "numeric",
    label: "Learning rate",
    props: {
      allowDecimal: true,
      decimalScale: 4,
      min: 0.0001,
      max: 1,
      step: 0.0005,
    },
  },
  imageSize: {
    type: "numeric",
    label: "Image size",
    props: {
      allowDecimal: false,
      min: 32,
      step: 32,
    },
  },
  earlyStopping: {
    type: "switch",
    label: "Early stopping",
  },
  earlyStoppingPatience: {
    type: "numeric",
    label: "Early stopping patience",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
})

function ProjectTrainPage() {
  const {
    applyTrainSettings,
    classes,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    totalSamples,
    trainSettings,
  } = useProjectOne()
  const [trainSettingsOpened, setTrainSettingsOpened] = useState(false)

  return (
    <Paper className="p-6" radius="xl" withBorder>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
          <Popover
            onDismiss={() => {
              setTrainSettingsOpened(false)
            }}
            opened={trainSettingsOpened}
            position="bottom-end"
            shadow="md"
            width={360}
            withArrow
          >
            <Popover.Target>
              <Button
                leftSection={<IconSettings className="size-4" />}
                onClick={() => {
                  setTrainSettingsOpened((current) => !current)
                }}
                variant="default"
              >
                Settings
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Form
                key={JSON.stringify(getTrainSettingsFormValues())}
                config={trainSettingsForm}
                defaultValues={getTrainSettingsFormValues()}
                onSubmit={async (values) => {
                  await applyTrainSettings(values)
                  setTrainSettingsOpened(false)
                }}
                renderRoot={({ children, onSubmit }) => (
                  <form className="space-y-3" onSubmit={onSubmit}>
                    <Text fw={600} size="sm">
                      Train Settings
                    </Text>
                    {children}
                    <Group justify="flex-end">
                      <Button
                        onClick={() => {
                          setTrainSettingsOpened(false)
                        }}
                        type="button"
                        variant="default"
                      >
                        Cancel
                      </Button>
                      <Button loading={isApplyingTrainSettings} type="submit">
                        Apply
                      </Button>
                    </Group>
                  </form>
                )}
              />
            </Popover.Dropdown>
          </Popover>
        </div>
        <Text c="dimmed" size="sm">
          Current dataset: {classes.length} classes, {totalSamples} samples.
        </Text>
        <Text c="dimmed" size="sm">
          Validation {Math.round(trainSettings.validationSplit * 100)}%, {trainSettings.epochs} epochs, batch size{" "}
          {trainSettings.batchSize}.
        </Text>
      </div>
    </Paper>
  )
}
