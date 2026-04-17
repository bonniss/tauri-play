import { Button, Drawer, Group, Text } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { defineConfig, Form } from "~/components/form"
import { useProjectPlay } from "~/components/project/play/ProjectPlayProvider"
import { t } from "~/lib/i18n"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"

const playSettingsForm = defineConfig<ProjectPlaySettingsFormValues>({
  autoPredictOnUpload: {
    type: "switch",
    label: "project.play.form.autoPredictOnUpload",
  },
  showConfidenceScores: {
    type: "switch",
    label: "project.play.form.showConfidenceScores",
  },
  showAllClasses: {
    type: "switch",
    label: "project.play.form.showAllClasses",
  },
  topK: {
    type: "numeric",
    label: "project.play.form.topK",
    props: {
      allowDecimal: false,
      min: 1,
    },
  },
  confidenceThreshold: {
    type: "numeric",
    label: "project.play.form.confidenceThreshold",
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
        {t("common.settings")}
      </Button>

      <Drawer
        onClose={() => {
          setSettingsOpened(false)
        }}
        opened={settingsOpened}
        padding="md"
        position="right"
        size="md"
        title={t("project.play.settingsTitle")}
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
                  {t("common.cancel")}
                </Button>
                <Button loading={isApplyingPlaySettings} type="submit">
                  {t("common.save")}
                </Button>
              </Group>
              <Text c="dimmed" size="sm">
                {t("project.play.settingsDescription")}
              </Text>
            </form>
          )}
        />
      </Drawer>
    </>
  )
}

export default PlayRuntimeSettings
