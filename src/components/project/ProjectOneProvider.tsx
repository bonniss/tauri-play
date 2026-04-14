import { useEffect, useState } from 'react';
import { createProvider } from 'react-easy-provider';
import { ProjectClassUpsertDto, renameClass } from '~/lib/db/domain/classes';
import { getProjectWorkspace, ProjectRecord } from '~/lib/db/domain/projects';
import { ProjectSampleUpsertDto } from '~/lib/db/domain/samples';
import { genClassId } from '~/lib/project/id-generator';

export type ExtendedProjectClass = ProjectClassUpsertDto & {
  samples: ProjectSampleUpsertDto[];
};

export const [useProjectOne, ProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId;

    const [isInitialized, setIsInitialized] = useState(false);
    const [project, setProject] = useState<ProjectRecord | undefined>();
    const [classes, setClasses] = useState<ExtendedProjectClass[]>([]);

    useEffect(() => {
      if (projectId) {
        (async () => {
          const workspace = await getProjectWorkspace(projectId);
          setProject(workspace.project);
          setClasses(
            workspace.classes.map((cls) => ({
              id: cls.id,
              name: cls.name,
              description: cls.description ?? undefined,
              order: cls.order,
              samples: workspace.samples.filter(
                (sample) => sample.classId === cls.id,
              ),
            })),
          );
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
    const totalSamples = classes.reduce(
      (acc, cls) => acc + cls.samples.length,
      0,
    );
    const isEmptyClass = totalClasses === 0;
    const isReadyForTrain = totalClasses > 1;

    const addClass = (payload: {
      name: string;
      description?: string;
      order?: number;
    }) => {
      const newClass = {
        id: genClassId(),
        projectId,
        name: payload.name,
        description: payload.description,
        order: payload.order ?? totalClasses,
        samples: [] as any,
      };
      setClasses((prev) => [...prev, newClass]);

      return newClass;
    };

    const updateClassName = (indexOrClassId: number | string, name: string) => {
      setClasses((prev) =>
        prev.map((cls) => {
          const classId =
            typeof indexOrClassId === 'number'
              ? prev[indexOrClassId]?.id
              : indexOrClassId;
          return cls.id === classId ? { ...cls, name } : cls;
        }),
      );
      renameClass({
        classId:
          typeof indexOrClassId === 'number'
            ? classes[indexOrClassId]?.id!
            : indexOrClassId,
        name,
      });
    };

    return {
      isLoading: !isInitialized,
      projectId,
      projectName,
      projectStatus,
      addClass,
      updateClassName,

      project,
      classes,
      totalClasses,
      totalSamples,
      isEmptyClass,
      isReadyForTrain,
    };
  },
);
