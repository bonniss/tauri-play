import { Alert, Button, Paper, Stack, Text } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Form, defineConfig } from '~/components/form';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import { ProjectPlaySettingsFormValues } from '~/lib/project/settings';

export const Route = createFileRoute('/projects/$projectId/play')({
  component: ProjectPlayPage,
});

const playSettingsForm = defineConfig<ProjectPlaySettingsFormValues>({
  mode: {
    type: 'radio',
    label: 'Demo mode',
    props: {
      className: 'col-span-full',
      orientation: 'horizontal',
      gap: 6,
      options: [
        {
          label: 'Upload',
          value: 'upload',
          description: 'Upload an image to get a prediction',
        },
        {
          label: 'Live',
          value: 'camera',
          description: 'Use your camera for real-time predictions',
        },
      ],
    },
  },
  autoPredictOnUpload: {
    type: 'switch',
    label: 'Auto predict on upload',
    description:
      'Automatically run predictions after uploading an image or video',
  },

  showConfidenceScores: {
    type: 'switch',
    label: 'Show confidence scores',
    description: 'Display how confident the model is for each prediction',
  },

  showAllClasses: {
    type: 'switch',
    label: 'Show all classes',
    description:
      'Show predictions for all classes instead of only the top results',
  },

  topK: {
    type: 'numeric',
    label: 'Top results',
    description: 'Number of highest-confidence predictions to display',
    props: {
      className: 'col-start-1',
      allowDecimal: false,
      min: 1,
    },
  },

  confidenceThreshold: {
    type: 'numeric',
    label: 'Confidence threshold',
    description: 'Only show predictions with confidence above this value',
    props: {
      allowDecimal: true,
      decimalScale: 2,
      min: 0,
      max: 1,
      step: 0.05,
    },
  },
});

function ProjectPlayPage() {
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

  return (
    <Paper className="p-4">
      <Stack gap="lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Play</h2>
          <Text c="dimmed" size="sm">
            Configure how people will experience <strong>{projectName}</strong>,
            then launch the project demo page.
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
                  Current mode: {playSettings.mode}
                </Text>
                <Button
                  disabled={!canPlay}
                  leftSection={<IconPlayerPlay className="size-4" />}
                  loading={isApplyingPlaySettings}
                  type="submit"
                >
                  Start
                </Button>
              </div>
            </form>
          )}
        />
      </Stack>
    </Paper>
  );
}
