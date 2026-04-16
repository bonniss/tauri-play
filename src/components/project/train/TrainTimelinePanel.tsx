import { Center, Paper, Text, Timeline } from "@mantine/core"
import {
  IconCheck,
  IconClockHour4,
  IconDeviceFloppy,
  IconX,
} from "@tabler/icons-react"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainTimelinePanel() {
  const { elapsedLabel, timelineSteps } = useDataTrain()

  return (
    <Paper
      className="border border-zinc-200 p-4 dark:border-zinc-800 xl:col-span-4 xl:row-span-2"
      radius="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Text fw={600}>Timeline</Text>
          {elapsedLabel ? (
            <Text c="dimmed" size="sm">
              {elapsedLabel}
            </Text>
          ) : null}
        </div>

        {timelineSteps.some((step) => step.status !== "pending") ? (
          <Timeline active={timelineSteps.length - 1} bulletSize={20} lineWidth={2}>
            {timelineSteps.map((step) => (
              <Timeline.Item
                bullet={
                  step.status === "completed" ? (
                    <IconCheck className="size-3.5" />
                  ) : step.status === "failed" ? (
                    <IconX className="size-3.5" />
                  ) : step.id === "saving" ? (
                    <IconDeviceFloppy className="size-3.5" />
                  ) : (
                    <IconClockHour4 className="size-3.5" />
                  )
                }
                color={
                  step.status === "completed"
                    ? "teal"
                    : step.status === "failed"
                      ? "red"
                      : step.status === "in_progress"
                        ? "blue"
                        : "gray"
                }
                key={step.id}
                title={step.label}
              >
                {step.detail || step.elapsedLabel ? (
                  <div className="space-y-0.5">
                    {step.detail ? (
                      <Text c="dimmed" size="xs">
                        {step.detail}
                      </Text>
                    ) : null}
                    {step.elapsedLabel ? (
                      <Text c="dimmed" size="xs">
                        {step.elapsedLabel}
                      </Text>
                    ) : null}
                  </div>
                ) : null}
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Center className="py-10">
            <Text c="dimmed" size="sm">
              No training run yet.
            </Text>
          </Center>
        )}
      </div>
    </Paper>
  )
}

export default TrainTimelinePanel
