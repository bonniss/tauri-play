import { Loader, Popover, Skeleton, ThemeIcon, Timeline } from '@mantine/core';
import { IconCheck, IconClockHour4, IconInfoCircle, IconX } from '@tabler/icons-react';
import clsx from 'clsx';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';
import MarkdownViewer from '~/components/shared/MarkdownViewer';

function TrainTimelinePanel() {
  const { t } = useAppProvider();
  const { elapsedLabel, timelineSteps } = useDataTrain();
  const [openedInfoId, setOpenedInfoId] = useState<string | null>(null);

  const isTimelineReady = timelineSteps.some(
    (step) => step.status !== 'pending',
  );

  if (!isTimelineReady) {
    return null;
  }

  return (
    <div className="space-y-4">
      {elapsedLabel ? <p className="text-lg">{elapsedLabel}</p> : null}
      <Timeline active={timelineSteps.length - 1} bulletSize={20} lineWidth={2}>
        {timelineSteps.map(({ detail, elapsedLabel, id, label, status }) => {
          const isInProgress = status === 'in_progress';
          const isLoading = status === 'in_progress' || status === 'pending';
          const infoContent = t(`project.train.timeline.info.${id}`);

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
              title={
                <span className="flex items-center gap-1">
                  {label}
                  <Popover
                    opened={openedInfoId === id}
                    onChange={(opened) => setOpenedInfoId(opened ? id : null)}
                    position="right"
                    width={280}
                    withArrow
                    shadow="md"
                  >
                    <Popover.Target>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenedInfoId(openedInfoId === id ? null : id);
                        }}
                        className="inline-flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      >
                        <IconInfoCircle className="size-3.5" />
                      </button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <MarkdownViewer className="prose-sm max-w-none">
                        {infoContent}
                      </MarkdownViewer>
                    </Popover.Dropdown>
                  </Popover>
                </span>
              }
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
    </div>
  );
}

export default TrainTimelinePanel;
