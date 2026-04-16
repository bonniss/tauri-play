import { Alert, Button, Paper } from "@mantine/core"
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"
import TrainDataSection from "~/components/project/train/TrainDataSection"
import TrainLogDrawer from "~/components/project/train/TrainLogDrawer"
import TrainRunSummaryCard from "~/components/project/train/TrainRunSummaryCard"
import TrainSettingsPopover from "~/components/project/train/TrainSettingsPopover"
import TrainTimelinePanel from "~/components/project/train/TrainTimelinePanel"

function TrainPageContent() {
  const { isReadyForTrain, isTraining, requestStopTraining, startTraining } =
    useDataTrain()

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Train</h2>
          <div className="flex gap-2">
            <Button
              color={isTraining ? "red" : undefined}
              disabled={!isReadyForTrain && !isTraining}
              leftSection={
                isTraining ? (
                  <IconPlayerStop className="size-4" />
                ) : (
                  <IconPlayerPlay className="size-4" />
                )
              }
              onClick={() => {
                if (isTraining) {
                  requestStopTraining()
                  return
                }

                void startTraining()
              }}
            >
              {isTraining ? "Stop Training" : "Start Training"}
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

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Paper className="p-4" withBorder radius="md">
          <TrainTimelinePanel />
        </Paper>
        <Paper className="p-4" withBorder radius="md">
          <TrainRunSummaryCard />
        </Paper>
      </div>

      <TrainDataSection />
      <TrainLogDrawer />
    </div>
  )
}

export default TrainPageContent
