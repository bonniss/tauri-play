import { Paper } from '@mantine/core';
import { createFileRoute } from '@tanstack/react-router';
import { DataTrainProvider } from '~/components/project/train/DataTrainProvider';
import TrainPageContent from '~/components/project/train/TrainPageContent';

export const Route = createFileRoute('/projects/$projectId/train')({
  component: ProjectTrainPage,
});

function ProjectTrainPage() {
  return (
    <DataTrainProvider>
      <TrainPageContent />
    </DataTrainProvider>
  );
}
