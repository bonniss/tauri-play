import { useEffect, useState } from 'react';
import { createProvider } from 'react-easy-provider';
import {
  getProjectWorkspace,
  ProjectRecord,
  type ProjectWorkspace,
} from '~/lib/db/domain/projects';

export const [useProjectOne, ProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId;

    const [isInitialized, setIsInitialized] = useState(false);
    const [project, setProject] = useState<ProjectRecord | undefined>();
    const [classes, setClasses] = useState<ProjectWorkspace['classes']>([]);
    const [samples, setSamples] = useState<ProjectWorkspace['samples']>([]);

    useEffect(() => {
      if (projectId) {
        (async () => {
          const workspace = await getProjectWorkspace(projectId);
          setProject(workspace.project);
          setClasses(workspace.classes ?? []);
          setSamples(workspace.samples ?? []);
          setIsInitialized(true);
        })();
      }
    }, [projectId]);

    if (!projectId) {
      throw new Error('Missing projectId.');
    }

    if (isInitialized && !project) {
      throw new Error('Project not found.');
    }

    const projectName = project?.name ?? '';
    const projectStatus = project?.status;

    const totalClasses = classes.length;
    const totalSamples = samples.length;
    const isEmptyClass = totalClasses === 0;
    const isReadyForTrain = totalClasses > 1;

    return {
      isLoading: !isInitialized,
      projectId,
      projectName,
      projectStatus,
      project,
      classes,
      samples,
      totalClasses,
      totalSamples,
      isEmptyClass,
      isReadyForTrain,
    };
  },
);
