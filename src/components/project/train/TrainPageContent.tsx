import { Alert, Button, Paper } from '@mantine/core';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useAppProvider } from '~/components/layout/AppProvider';
import ProjectPlayButton from '~/components/project/ProjectPlayButton';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import TrainDataSection from '~/components/project/train/TrainDataSection';
import TrainLogDrawer from '~/components/project/train/TrainLogDrawer';
import TrainRunSummaryCard from '~/components/project/train/TrainRunSummaryCard';
import TrainSettingsPopover from '~/components/project/train/TrainSettingsPopover';
import TrainTimelinePanel from '~/components/project/train/TrainTimelinePanel';

function TrainPageContent() {
  const { t } = useAppProvider();
  const { canPlay } = useProjectOne();
  const {
    displayedTrainLog,
    isReadyForTrain,
    isTraining,
    requestStopTraining,
    startTraining,
  } = useDataTrain();

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t('project.train.title')}
        </h2>
        <div className="flex gap-2">
          {canPlay ? <ProjectPlayButton /> : null}
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
                requestStopTraining();
                return;
              }
              void startTraining();
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
        <Alert variant="default">{t('project.train.notReadyAlert')}</Alert>
      ) : null}

      {!displayedTrainLog && !isTraining ? (
        <p>Chưa có log run nào</p>
      ) : (
        <>
          <Paper
            withBorder
            radius="md"
            className="flex flex-col gap-4 md:flex-row md:gap-0"
          >
            <section className="md:flex-1 p-4">
              <TrainRunSummaryCard />
            </section>
            <section className="md:flex-1 p-4 border-l dark:border-white/10">
              <TrainTimelinePanel />
            </section>
          </Paper>

          <TrainDataSection />
          <TrainLogDrawer />
        </>
      )}
    </div>
  );
}

export default TrainPageContent;
