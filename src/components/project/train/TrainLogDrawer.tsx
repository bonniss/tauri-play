import { Drawer, Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainLogDrawer() {
  const {
    closeLogDetails,
    displayedTrainLog,
    logDetailsOpened,
    logEntries,
    projectId,
  } = useDataTrain()

  return (
    <Drawer
      onClose={closeLogDetails}
      opened={logDetailsOpened}
      padding="md"
      position="right"
      size="lg"
      title="Training Log"
    >
      {displayedTrainLog ? (
        <>
          <div className="border-b border-white/10 px-3 py-2 font-mono text-xs text-zinc-400">
            train@{projectId}
          </div>
          <div className="space-y-1 px-3 py-3 font-mono text-xs">
            {logEntries.map((entry) => (
              <div className="leading-5" key={entry.key}>
                <span className="mr-2 text-zinc-500">{entry.timeLabel}</span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Text c="dimmed" size="sm">
          No train log yet.
        </Text>
      )}
    </Drawer>
  )
}

export default TrainLogDrawer
