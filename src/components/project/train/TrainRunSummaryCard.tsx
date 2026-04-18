import { Button, Divider, Progress, Text } from '@mantine/core';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';
import TrainStatsGrid from './TrainStatsGrid';

function TrainRunSummaryCard() {
  const { t } = useAppProvider();
  const {
    displayedTrainLog,
    isTraining,
    latestEpochNumber,
    openLogDetails,
    plannedEpochs,
    summaryStats,
    trainProgressPercent,
    trainStatusText,
  } = useDataTrain();

  if (!displayedTrainLog) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Text fw={600}>{t('project.train.latestRun')}</Text>
          <Text c="dimmed" size="sm">
            {trainStatusText}
          </Text>
        </div>
        <Button onClick={openLogDetails} size="xs" variant="default">
          {t('project.train.viewLog')}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-3">
          <div className="text-6xl font-semibold tracking-tight">
            {trainProgressPercent}%
          </div>
          <Text c="dimmed" mb={8} size="sm">
            {t('project.train.epochsProgress', {
              params: { current: latestEpochNumber, total: plannedEpochs },
            })}
          </Text>
        </div>
        <Progress
          animated={isTraining}
          radius="xl"
          size="xl"
          value={trainProgressPercent}
        />
      </div>

      {summaryStats.length > 0 ? (
        <>
          <Divider />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="space-y-0.5">
                <Text c="dimmed" size="xs" tt="uppercase">
                  {stat.label}
                </Text>
                <Text
                  className="text-2xl font-semibold tracking-tight"
                  fw={600}
                >
                  {stat.value}
                </Text>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <Divider />

      <TrainStatsGrid />
    </div>
  );
}

export default TrainRunSummaryCard;
