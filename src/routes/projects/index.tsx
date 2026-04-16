import { createFileRoute } from '@tanstack/react-router';
import ProjectDirectory from '~/components/project/ProjectDirectory';

export const Route = createFileRoute('/projects/')({
  validateSearch: (search: Record<string, unknown>) => ({
    create: search.create === true || search.create === 'true' || search.create === '1',
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const search = Route.useSearch();

  return <ProjectDirectory createRequested={search.create} />;
}

export default ProjectsPage;
