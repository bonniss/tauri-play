import { Button, Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainStatsGrid() {
  const {
    hasTrainData,
    inspectedDataSnapshot,
    openTrainDataDrawer,
    openValidationDataDrawer,
    validationSplitLabel,
  } = useDataTrain()

  return (
    <div className="grid grid-cols-3 gap-4">
      <DataBlock label="Validation Split" value={validationSplitLabel} />

      <Button
        className="h-auto min-h-24 flex-1 rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-left text-inherit hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
        disabled={!hasTrainData}
        onClick={() => {
          openTrainDataDrawer()
        }}
        styles={{
          inner: {
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
          },
          label: {
            width: "100%",
          },
          root: {
            borderWidth: 1,
          },
        }}
        variant="default"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="space-y-1">
            <Text c="dimmed" size="xs" tt="uppercase">
              Train Images
            </Text>
            <Text className="text-3xl font-semibold tracking-tight" fw={600}>
              {inspectedDataSnapshot.trainSamples}
            </Text>
          </div>
        </div>
      </Button>

      <Button
        className="h-auto min-h-24 flex-1 rounded-xl border border-zinc-200 bg-transparent px-4 py-3 text-left text-inherit hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60"
        disabled={!hasTrainData}
        onClick={() => {
          openValidationDataDrawer()
        }}
        styles={{
          inner: {
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
          },
          label: {
            width: "100%",
          },
          root: {
            borderWidth: 1,
          },
        }}
        variant="default"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <div className="space-y-1">
            <Text c="dimmed" size="xs" tt="uppercase">
              Validation Images
            </Text>
            <Text className="text-3xl font-semibold tracking-tight" fw={600}>
              {inspectedDataSnapshot.validationSamples}
            </Text>
          </div>
        </div>
      </Button>
    </div>
  )
}

function DataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 flex-1 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="space-y-1">
        <Text c="dimmed" size="xs" tt="uppercase">
          {label}
        </Text>
        <Text className="text-3xl font-semibold tracking-tight" fw={600}>
          {value}
        </Text>
      </div>
    </div>
  )
}

export default TrainStatsGrid
