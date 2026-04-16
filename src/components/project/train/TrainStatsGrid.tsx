import { Paper, Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainStatsGrid() {
  const { summaryStats } = useDataTrain()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:col-span-8">
      {summaryStats.map((stat) => (
        <Paper
          className="flex min-h-40 flex-col justify-between border border-zinc-200 p-4 dark:border-zinc-800"
          key={stat.label}
          radius="lg"
        >
          <Text c="dimmed" size="xs" tt="uppercase">
            {stat.label}
          </Text>
          <Text className="text-4xl font-semibold tracking-tight" fw={600}>
            {stat.value}
          </Text>
        </Paper>
      ))}
    </div>
  )
}

export default TrainStatsGrid
