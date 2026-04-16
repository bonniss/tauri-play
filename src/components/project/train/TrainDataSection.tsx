import { Group, Paper, SegmentedControl, Stack, Text } from "@mantine/core"
import SampleGrid from "~/components/project/SampleGrid"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainDataSection() {
  const {
    displayedSplitSamples,
    hasTrainData,
    setTrainDataView,
    trainDataView,
    trainDataViewOptions,
  } = useDataTrain()

  if (!hasTrainData) {
    return null
  }

  return (
    <Paper
      className="border border-zinc-200 p-4 dark:border-zinc-800"
      radius="lg"
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Train Data</Text>
          <SegmentedControl
            data={trainDataViewOptions}
            onChange={(value) => {
              setTrainDataView(value as "train" | "validation")
            }}
            value={trainDataView}
          />
        </Group>
        <SampleGrid samples={displayedSplitSamples} />
      </Stack>
    </Paper>
  )
}

export default TrainDataSection
