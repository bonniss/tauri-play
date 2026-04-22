import { ActionIcon, Button, Group, Popover, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { useMemo } from 'react';
import { defineConfig, Form } from '~/components/form';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useDataTrain } from '~/components/project/train/DataTrainProvider';
import { ProjectTrainSettingsFormValues } from '~/lib/project/settings';

function TrainSettingsPopover() {
  const { t, locale } = useAppProvider();
  const {
    applyTrainSettings,
    getTrainSettingsFormValues,
    isApplyingTrainSettings,
    isTraining,
    setTrainSettingsOpened,
    trainSettingsOpened,
  } = useDataTrain();

  const trainSettingsForm = useMemo(
    () =>
      defineConfig<ProjectTrainSettingsFormValues>({
        validationSplit: {
          type: 'numeric',
          label: 'project.train.form.validationSplit',
          description: 'project.train.form.validationSplitDescription',
          props: {
            allowDecimal: true,
            decimalScale: 2,
            min: 0.05,
            max: 0.5,
            step: 0.05,
          },
        },
        epochs: {
          type: 'numeric',
          label: 'project.train.form.epochs',
          description: 'project.train.form.epochsDescription',
          props: { allowDecimal: false, min: 1 },
        },
        batchSize: {
          type: 'numeric',
          label: 'project.train.form.batchSize',
          description: 'project.train.form.batchSizeDescription',
          props: { allowDecimal: false, min: 1 },
        },
        learningRate: {
          type: 'numeric',
          label: 'project.train.form.learningRate',
          description: 'project.train.form.learningRateDescription',
          props: {
            allowDecimal: true,
            decimalScale: 4,
            min: 0.0001,
            max: 1,
            step: 0.0005,
          },
        },
        imageSize: { type: 'hidden' },
        earlyStopping: {
          type: 'switch',
          label: 'project.train.form.earlyStopping',
          description: 'project.train.form.earlyStoppingDescription',
        },
        earlyStoppingPatience: {
          type: 'numeric',
          label: 'project.train.form.earlyStoppingPatience',
          description: 'project.train.form.earlyStoppingPatienceDescription',
          props: { allowDecimal: false, min: 1 },
        },
      }),
    [locale],
  );

  return (
    <Popover
      onDismiss={() => {
        setTrainSettingsOpened(false);
      }}
      opened={trainSettingsOpened}
      position="bottom-end"
      shadow="md"
      width={360}
      withArrow
    >
      <Popover.Target>
        <ActionIcon
          disabled={isTraining}
          size="input-sm"
          title={t('common.settings')}
          onClick={() => {
            setTrainSettingsOpened(!trainSettingsOpened);
          }}
          variant="default"
        >
          <IconSettings className="size-4" />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Form
          key={JSON.stringify(getTrainSettingsFormValues())}
          config={trainSettingsForm}
          defaultValues={getTrainSettingsFormValues()}
          onSubmit={async (values) => {
            await applyTrainSettings(values);
            setTrainSettingsOpened(false);
          }}
          renderRoot={({ children, onSubmit }) => (
            <form className="space-y-3" onSubmit={onSubmit}>
              <Text fw={600} size="sm">
                {t('project.train.settingsTitle')}
              </Text>
              {children}
              <Group justify="flex-end">
                <Button
                  onClick={() => {
                    setTrainSettingsOpened(false);
                  }}
                  type="button"
                  variant="default"
                >
                  {t('common.cancel')}
                </Button>
                <Button loading={isApplyingTrainSettings} type="submit">
                  {t('common.apply')}
                </Button>
              </Group>
            </form>
          )}
        />
      </Popover.Dropdown>
    </Popover>
  );
}

export default TrainSettingsPopover;
