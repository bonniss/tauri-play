import { Button, Drawer, Group, Text } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { defineConfig, Form } from "~/components/form"
import { useProjectPlay } from "~/components/project/play/ProjectPlayProvider"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"

const playSettingsForm = defineConfig<ProjectPlaySettingsFormValues>({
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

function PlayRuntimeSettings() {
  const {
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    setSettingsOpened,
    settingsOpened,
    submitPlaySettings,
  } = useProjectPlay()

  return (
    <>
      <Button
        leftSection={<IconSettings className="size-4" />}
        onClick={() => {
          setSettingsOpened(true)
        }}
        variant="default"
      >
        Settings
      </Button>

      <Drawer
        onClose={() => {
          setSettingsOpened(false)
        }}
        opened={settingsOpened}
        padding="md"
        position="right"
        size="md"
        title="Play Settings"
      >
        <Form
          key={JSON.stringify(getPlaySettingsFormValues())}
          config={playSettingsForm}
          defaultValues={getPlaySettingsFormValues()}
          onSubmit={submitPlaySettings}
          renderRoot={({ children, onSubmit }) => (
            <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
              {children}
              <Group justify="flex-end">
                <Button
                  onClick={() => {
                    setSettingsOpened(false)
                  }}
                  type="button"
                  variant="default"
                >
                  Cancel
                </Button>
                <Button loading={isApplyingPlaySettings} type="submit">
                  Save
                </Button>
              </Group>
              <Text c="dimmed" size="sm">
                These settings apply to this project demo page.
              </Text>
            </form>
          )}
        />
      </Drawer>
    </>
  )
}

export default PlayRuntimeSettings
