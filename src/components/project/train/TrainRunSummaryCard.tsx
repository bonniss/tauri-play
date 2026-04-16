import { Alert, Button, Paper, Progress, Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainRunSummaryCard() {
  const {
    displayedTrainLog,
    isTraining,
    latestEpochNumber,
    openLogDetails,
    plannedEpochs,
    trainProgressPercent,
    trainStatusText,
  } = useDataTrain()

  return (
    <Paper
      className="border border-zinc-200 p-4 dark:border-zinc-800 xl:col-span-8"
      radius="lg"
    >
      {displayedTrainLog ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Text fw={600}>Latest training run</Text>
              <Text c="dimmed" size="sm">
                {trainStatusText}
              </Text>
            </div>
            <Button onClick={openLogDetails} size="xs" variant="default">
              View Log Details
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="text-6xl font-semibold tracking-tight">
                {trainProgressPercent}%
              </div>
              <Text c="dimmed" mb={8} size="sm">
                {latestEpochNumber}/{plannedEpochs} epochs
              </Text>
            </div>
            <Progress
              animated={isTraining}
              radius="xl"
              size="xl"
              value={trainProgressPercent}
            />
          </div>
        </div>
      ) : (
        <Alert color="blue" variant="light">
          Training has not started yet.
        </Alert>
      )}
    </Paper>
  )
}

export default TrainRunSummaryCard
