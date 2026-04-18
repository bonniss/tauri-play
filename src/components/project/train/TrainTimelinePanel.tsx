import {
  Center,
  Loader,
  Skeleton,
  Text,
  ThemeIcon,
  Timeline,
} from '@mantine/core';
import { IconCheck, IconClockHour4, IconX } from '@tabler/icons-react';
import clsx from 'clsx';
import { match } from 'ts-pattern';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';

function TrainTimelinePanel() {
  const { t } = useAppProvider();
  const { elapsedLabel, timelineSteps } = useDataTrain();

  return (
    <div className="space-y-4">
      {elapsedLabel ? <p className="text-lg">{elapsedLabel}</p> : null}

      {timelineSteps.some((step) => step.status !== 'pending') ? (
        <Timeline
          active={timelineSteps.length - 1}
          bulletSize={20}
          lineWidth={2}
        >
          {timelineSteps.map(({ detail, elapsedLabel, id, label, status }) => {
            const isInProgress = status === 'in_progress';
            const isLoading = status === 'in_progress' || status === 'pending';

            return (
              <Timeline.Item
                bullet={match(status)
                  .with('completed', () => <IconCheck className="size-3.5" />)
                  .with('failed', () => <IconX className="size-3.5" />)
                  .with('in_progress', () => (
                    <ThemeIcon
                      size={22}
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'orange' }}
                      radius="xl"
                    >
                      <Loader />
                    </ThemeIcon>
                  ))
                  .otherwise(() => (
                    <IconClockHour4 className="size-3.5" />
                  ))}
                color={match(status)
                  .with('completed', () => 'teal')
                  .with('failed', () => 'red')
                  .otherwise(() => 'gray')}
                key={id}
                title={label}
              >
                <div className="space-y-0.5 text-xs">
                  <Skeleton
                    animate={isInProgress}
                    className={clsx('rounded', isLoading && 'w-32')}
                    visible={isLoading}
                  >
                    <p>{isLoading ? '-' : (detail ?? '-')}</p>
                  </Skeleton>
                  <p>{elapsedLabel ?? '-'}</p>
                </div>
              </Timeline.Item>
            );
          })}
        </Timeline>
      ) : (
        <Center className="py-10">
          <Text c="dimmed" size="sm">
            {t('project.train.noRunYet')}
          </Text>
        </Center>
      )}
    </div>
  );
}

export default TrainTimelinePanel;
