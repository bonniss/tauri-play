import { Button, Group, Popover, Text } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { defineConfig, Form } from "~/components/form"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"
import { ProjectTrainSettingsFormValues } from "~/lib/project/settings"

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

function TrainSettingsPopover() {
  const {
    applyTrainSettings,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    setTrainSettingsOpened,
    trainSettingsOpened,
  } = useDataTrain()

  return (
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
            setTrainSettingsOpened(!trainSettingsOpened)
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
  )
}

export default TrainSettingsPopover
