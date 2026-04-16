import { Alert, Button } from "@mantine/core"
import { IconPlayerPlay } from "@tabler/icons-react"
import TrainDataSection from "~/components/project/train/TrainDataSection"
import TrainLogDrawer from "~/components/project/train/TrainLogDrawer"
import TrainRunSummaryCard from "~/components/project/train/TrainRunSummaryCard"
import TrainSettingsPopover from "~/components/project/train/TrainSettingsPopover"
import TrainStatsGrid from "~/components/project/train/TrainStatsGrid"
import TrainTimelinePanel from "~/components/project/train/TrainTimelinePanel"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"

function TrainPageContent() {
  const { isReadyForTrain, isTraining, startTraining } = useDataTrain()

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
          <div className="flex gap-2">
            <Button
              disabled={!isReadyForTrain}
              leftSection={<IconPlayerPlay className="size-4" />}
              loading={isTraining}
              onClick={() => {
                void startTraining()
              }}
            >
              Start Training
            </Button>
            <TrainSettingsPopover />
          </div>
        </div>
      </div>

      {!isReadyForTrain ? (
        <Alert color="yellow" variant="light">
          Label data is not ready yet. Complete the minimum class and sample
          requirements first.
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-12">
        <TrainTimelinePanel />
        <TrainRunSummaryCard />
        <TrainStatsGrid />
      </div>

      <TrainDataSection />
      <TrainLogDrawer />
    </div>
  )
}

export default TrainPageContent
