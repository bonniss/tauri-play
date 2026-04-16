import { createFileRoute } from '@tanstack/react-router';
import ProjectDirectory from '~/components/project/ProjectDirectory';

export const Route = createFileRoute('/projects/')({
  component: ProjectsPage,
});

function ProjectsPage() {
  return <ProjectDirectory />;
}

export default ProjectsPage;
