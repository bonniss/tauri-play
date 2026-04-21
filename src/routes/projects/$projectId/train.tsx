import { createFileRoute } from '@tanstack/react-router';
import { DataTrainProvider } from '~/components/project/train/DataTrainProvider';
import TrainPageContent from '~/components/project/train/TrainPageContent';

export const Route = createFileRoute('/projects/$projectId/train')({
  validateSearch: (search: Record<string, unknown>) => ({
    autostart:
      search.autostart === true ||
      search.autostart === 'true' ||
      search.autostart === '1',
  }),
  component: ProjectTrainPage,
});

function ProjectTrainPage() {
  return (
    <DataTrainProvider>
      <TrainPageContent />
    </DataTrainProvider>
  );
}
