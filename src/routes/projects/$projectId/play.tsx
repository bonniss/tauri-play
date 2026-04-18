import { Alert, Button, Paper, Stack, Text } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Form, defineConfig } from '~/components/form';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import { ProjectPlaySettingsFormValues } from '~/lib/project/settings';

export const Route = createFileRoute('/projects/$projectId/play')({
  component: ProjectPlayPage,
});

function ProjectPlayPage() {
  const { t, locale } = useAppProvider();
  const {
    applyPlaySettings,
    canPlay,
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    playGuardDescription,
    playGuardTitle,
    playSettings,
    projectId,
    projectName,
  } = useProjectOne();
  const navigate = useNavigate();

  const playSettingsForm = useMemo(
    () =>
      defineConfig<ProjectPlaySettingsFormValues>({
        mode: {
          type: 'radio',
          label: 'project.play.form.mode',
          props: {
            className: 'col-span-full',
            orientation: 'horizontal',
            gap: 6,
            options: [
              {
                label: t('project.play.form.modeUploadLabel'),
                value: 'upload',
                description: t('project.play.form.modeUploadDescription'),
              },
              {
                label: t('project.play.form.modeLiveLabel'),
                value: 'camera',
                description: t('project.play.form.modeLiveDescription'),
              },
            ],
          },
        },
        autoPredictOnUpload: {
          type: 'switch',
          label: 'project.play.form.autoPredictOnUpload',
          description: 'project.play.form.autoPredictOnUploadDescription',
        },
        showConfidenceScores: {
          type: 'switch',
          label: 'project.play.form.showConfidenceScores',
          description: 'project.play.form.showConfidenceScoresDescription',
        },
        showAllClasses: {
          type: 'switch',
          label: 'project.play.form.showAllClasses',
          description: 'project.play.form.showAllClassesDescription',
        },
        topK: {
          type: 'numeric',
          label: 'project.play.form.topK',
          description: 'project.play.form.topKDescription',
          props: {
            className: 'col-start-1',
            allowDecimal: false,
            min: 1,
          },
        },
        confidenceThreshold: {
          type: 'numeric',
          label: 'project.play.form.confidenceThreshold',
          description: 'project.play.form.confidenceThresholdDescription',
          props: {
            allowDecimal: true,
            decimalScale: 2,
            min: 0,
            max: 1,
            step: 0.05,
          },
        },
      }),
    [locale],
  );

  return (
    <Paper className="p-4">
      <Stack gap="lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('project.play.title')}
          </h2>
          <Text c="dimmed" size="sm">
            {t('project.play.description', { params: { name: projectName } })}
          </Text>
        </div>

        {!canPlay && playGuardTitle ? (
          <Alert color="yellow" variant="light">
            <Stack gap={4}>
              <Text fw={600} size="sm">
                {playGuardTitle}
              </Text>
              <Text size="sm">{playGuardDescription}</Text>
            </Stack>
          </Alert>
        ) : null}

        <Form
          key={JSON.stringify(getPlaySettingsFormValues())}
          config={playSettingsForm}
          defaultValues={getPlaySettingsFormValues()}
          onSubmit={async (values) => {
            await applyPlaySettings(values);
            await navigate({
              to: '/p/$projectId',
              params: { projectId },
            });
          }}
          renderRoot={({ children, onSubmit }) => (
            <form className="grid grid-cols-2 gap-4" onSubmit={onSubmit}>
              {children}
              <div className="col-span-full flex justify-between">
                <Text c="dimmed" size="sm">
                  {t('project.play.currentMode', {
                    params: { mode: playSettings.mode },
                  })}
                </Text>
                <Button
                  disabled={!canPlay}
                  leftSection={<IconPlayerPlay className="size-4" />}
                  loading={isApplyingPlaySettings}
                  type="submit"
                >
                  {t('project.play.start')}
                </Button>
              </div>
            </form>
          )}
        />
      </Stack>
    </Paper>
  );
}
