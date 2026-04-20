import { Button, Paper } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPackageExport, IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Alert } from '@mantine/core'
import { useAppProvider } from '~/components/layout/AppProvider'
import { useProjectOne } from '~/components/project/ProjectOneProvider'
import { useDataTrain } from '~/components/project/train/DataTrainProvider'
import ExportModelModal from '~/components/project/train/ExportModelModal'
import TrainDataSection from '~/components/project/train/TrainDataSection'
import TrainLogDrawer from '~/components/project/train/TrainLogDrawer'
import TrainRunSummaryCard from '~/components/project/train/TrainRunSummaryCard'
import TrainSettingsPopover from '~/components/project/train/TrainSettingsPopover'
import TrainTimelinePanel from '~/components/project/train/TrainTimelinePanel'

function TrainPageContent() {
  const { t } = useAppProvider()
  const { projectId, projectName, projectModel } = useProjectOne()
  const {
    displayedTrainLog,
    isReadyForTrain,
    isTraining,
    requestStopTraining,
    startTraining,
  } = useDataTrain()
  const [exportOpened, { open: openExport, close: closeExport }] = useDisclosure(false)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('project.train.title')}
        </h2>
        <div className="flex gap-2">
          <Button
            color={isTraining ? 'red' : undefined}
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
            {isTraining
              ? t('project.train.stopTraining')
              : t('project.train.startTraining')}
          </Button>
          <TrainSettingsPopover />
        </div>
      </div>

      {!isReadyForTrain ? (
        <Alert color="yellow" variant="light">
          {t('project.train.notReadyAlert')}
        </Alert>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[3fr_2fr]">
        <Paper className="p-4" withBorder radius="md">
          <TrainTimelinePanel />
        </Paper>
        <div className="flex flex-col gap-4">
          {projectModel ? (
            <>
              <Button
                component={Link}
                to="/projects/$projectId/play"
                params={{ projectId } as never}
                size="md"
                fullWidth
                leftSection={<IconPlayerPlay className="size-4" />}
              >
                {t('project.train.openPlay')}
              </Button>
              <Button
                variant="light"
                fullWidth
                leftSection={<IconPackageExport className="size-4" />}
                onClick={openExport}
              >
                {t('project.train.exportModel')}
              </Button>
            </>
          ) : null}
          {displayedTrainLog ? (
            <Paper className="p-4" withBorder radius="md">
              <TrainRunSummaryCard />
            </Paper>
          ) : null}
        </div>
      </div>

      <TrainDataSection />
      <TrainLogDrawer />

      {projectModel ? (
        <ExportModelModal
          opened={exportOpened}
          onClose={closeExport}
          artifactPath={projectModel.artifactPath}
          projectName={projectName}
        />
      ) : null}
    </div>
  )
}

export default TrainPageContent
