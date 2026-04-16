import { Button, Divider, Progress, Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"
import TrainStatsGrid from "./TrainStatsGrid"

function TrainRunSummaryCard() {
  const {
    displayedTrainLog,
    summaryStats,
    isTraining,
    latestEpochNumber,
    openLogDetails,
    plannedEpochs,
    trainProgressPercent,
    trainStatusText,
  } = useDataTrain()

  return (
    <>
      {displayedTrainLog ? (
        <div className="space-y-6">
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

          <Divider />

          <div className="grid grid-cols-4 gap-4">
            {summaryStats.map((stat) => (
              <div className="space-y-1" key={stat.label}>
                <Text c="dimmed" size="xs" tt="uppercase">
                  {stat.label}
                </Text>
                <Text
                  className="text-3xl font-semibold tracking-tight"
                  fw={600}
                >
                  {stat.value}
                </Text>
              </div>
            ))}
          </div>

          <Divider />

          <TrainStatsGrid />
        </div>
      ) : null}
    </>
  )
}

export default TrainRunSummaryCard
