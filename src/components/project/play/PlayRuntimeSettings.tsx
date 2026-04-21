import { Button, Drawer, Group, Text } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { useMemo } from "react"
import { defineConfig, Form } from "~/components/form"
import { useAppProvider } from "~/components/layout/AppProvider"
import { useProjectPlay } from "~/components/project/play/ProjectPlayProvider"
import { t } from "~/lib/i18n"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"

function PlayRuntimeSettings() {
  const { locale } = useAppProvider()
  const {
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    setSettingsOpened,
    settingsOpened,
    submitPlaySettings,
  } = useProjectPlay()
  const playSettingsForm = useMemo(
    () =>
      defineConfig<ProjectPlaySettingsFormValues>({
        mode: {
          type: "radio",
          label: "project.play.form.mode",
          props: {
            className: "col-span-full",
            orientation: "horizontal",
            gap: 6,
            options: [
              {
                label: t("project.play.form.modeUploadLabel"),
                value: "upload",
                description: t("project.play.form.modeUploadDescription"),
              },
              {
                label: t("project.play.form.modeLiveLabel"),
                value: "camera",
                description: t("project.play.form.modeLiveDescription"),
              },
            ],
          },
        },
        autoPredictOnUpload: {
          type: "switch",
          label: "project.play.form.autoPredictOnUpload",
          description: "project.play.form.autoPredictOnUploadDescription",
        },
        showConfidenceScores: {
          type: "switch",
          label: "project.play.form.showConfidenceScores",
          description: "project.play.form.showConfidenceScoresDescription",
        },
        showAllClasses: {
          type: "switch",
          label: "project.play.form.showAllClasses",
          description: "project.play.form.showAllClassesDescription",
        },
        topK: {
          type: "numeric",
          label: "project.play.form.topK",
          description: "project.play.form.topKDescription",
          props: {
            allowDecimal: false,
            min: 1,
          },
        },
        confidenceThreshold: {
          type: "numeric",
          label: "project.play.form.confidenceThreshold",
          description: "project.play.form.confidenceThresholdDescription",
          props: {
            allowDecimal: true,
            decimalScale: 2,
            min: 0,
            max: 1,
            step: 0.05,
          },
        },
        __liveSection: {
          type: "section",
          label: "",
          visible: (formData) => formData.mode === "camera",
          render: ({ children }) => children,
          props: {
            nested: false,
            config: defineConfig<ProjectPlaySettingsFormValues>({
              liveAspectRatio: {
                type: "radio",
                label: "project.play.form.liveAspectRatio",
                description: "project.play.form.liveAspectRatioDescription",
                props: {
                  className: "col-span-full",
                  orientation: "vertical",
                  gap: 4,
                  options: [
                    {
                      label: t("project.play.form.liveAspectRatio169"),
                      value: "16:9",
                    },
                    {
                      label: t("project.play.form.liveAspectRatio43"),
                      value: "4:3",
                    },
                    {
                      label: t("project.play.form.liveAspectRatio11"),
                      value: "1:1",
                    },
                  ],
                },
              },
              livePredictInterval: {
                type: "numeric",
                label: "project.play.form.livePredictInterval",
                description: "project.play.form.livePredictIntervalDescription",
                props: {
                  allowDecimal: false,
                  min: 100,
                  max: 5000,
                  step: 100,
                },
              },
            }),
          },
        },
      }),
    [locale],
  )

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
