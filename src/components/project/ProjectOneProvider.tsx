import { useEffect, useState } from 'react';
import { createProvider } from 'react-easy-provider';
import { ProjectClass, renameClass } from '~/lib/db/domain/classes';
import { getProjectWorkspace, ProjectRecord } from '~/lib/db/domain/projects';
import { ProjectSample } from '~/lib/db/domain/samples';
import { genClassId, genSampleId } from '~/lib/project/id-generator';

export const MIN_CLASSES_FOR_TRAIN = 2;
export const MIN_SAMPLES_PER_CLASS_FOR_TRAIN = 10;

export type ProjectOneClass = Pick<
  ProjectClass,
  'id' | 'projectId' | 'name' | 'description' | 'order'
> & {
  samples: ProjectSample[];
};

type ProjectOneSampleDraft = Pick<
  ProjectSample,
  'classId' | 'filePath' | 'source'
> & {
  id?: string;
  createdAt?: string;
  order?: number;
};

export const [useProjectOne, ProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId;

    const [isInitialized, setIsInitialized] = useState(false);
    const [project, setProject] = useState<ProjectRecord | undefined>();
    const [classes, setClasses] = useState<ProjectOneClass[]>([]);

    useEffect(() => {
      if (projectId) {
        (async () => {
          const workspace = await getProjectWorkspace(projectId);
          setProject(workspace.project);
          setClasses(
            workspace.classes.map((cls) => ({
              id: cls.id,
              projectId: cls.projectId,
              name: cls.name,
              description: cls.description,
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
    const classReadiness = classes.map((cls) => ({
      classId: cls.id,
      sampleCount: cls.samples.length,
      targetSampleCount: MIN_SAMPLES_PER_CLASS_FOR_TRAIN,
      progress:
        Math.min(cls.samples.length, MIN_SAMPLES_PER_CLASS_FOR_TRAIN) /
        MIN_SAMPLES_PER_CLASS_FOR_TRAIN,
      isReady: cls.samples.length >= MIN_SAMPLES_PER_CLASS_FOR_TRAIN,
    }));
    const requiredSamplesForTrain =
      Math.max(totalClasses, MIN_CLASSES_FOR_TRAIN) *
      MIN_SAMPLES_PER_CLASS_FOR_TRAIN;
    const readySampleContribution = classReadiness.reduce(
      (sum, item) => sum + Math.min(item.sampleCount, item.targetSampleCount),
      0,
    );
    const trainProgress =
      requiredSamplesForTrain > 0
        ? readySampleContribution / requiredSamplesForTrain
        : 0;
    const isEmptyClass = totalClasses === 0;
    const isReadyForTrain =
      totalClasses >= MIN_CLASSES_FOR_TRAIN &&
      classReadiness.every((item) => item.isReady);

    const addClass = (payload: {
      name: string;
      description?: string;
      order?: number;
    }) => {
      const newClass = {
        id: genClassId(),
        projectId,
        name: payload.name,
        description: payload.description ?? null,
        order: payload.order ?? totalClasses,
        samples: [],
      };
      setClasses((prev) => [...prev, newClass]);

      return newClass;
    };

    const removeClass = (classId: string) => {
      setClasses((prev) => prev.filter((item) => item.id !== classId));
    };

    const seedClass = () => {
      const newClass = {
        id: genClassId(),
        projectId,
        name: `Class ${totalClasses + 1}`,
        description: null,
        order: totalClasses,
        samples: [],
      };
      setClasses((prev) => [...prev, newClass]);

      return newClass;
    };

    const addSamplesToClass = (
      classId: string,
      nextSamples: ProjectOneSampleDraft[],
    ) => {
      let optimisticSamples: ProjectSample[] = [];

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) {
            return cls;
          }

          const startOrder = cls.samples.length;
          optimisticSamples = nextSamples.map((sample, index) => ({
            id: sample.id ?? genSampleId(),
            projectId,
            classId,
            filePath: sample.filePath,
            source: sample.source,
            order: sample.order ?? startOrder + index,
            className: cls.name,
            createdAt: sample.createdAt ?? new Date().toISOString(),
          }));

          return {
            ...cls,
            samples: [...cls.samples, ...optimisticSamples],
          };
        }),
      );

      return optimisticSamples;
    };

    const removeSamplesFromClass = (classId: string, sampleIds: string[]) => {
      const sampleIdSet = new Set(sampleIds);

      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId
            ? {
                ...cls,
                samples: cls.samples.filter((sample) => !sampleIdSet.has(sample.id)),
              }
            : cls,
        ),
      );
    };

    const setProjectStatus = (status: ProjectRecord['status']) => {
      setProject((current) =>
        current
          ? {
              ...current,
              status,
              updatedAt: new Date().toISOString(),
            }
          : current,
      );
    };

    const updateClassName = (indexOrClassId: number | string, name: string) => {
      const trimmedName = name.trim();
      const currentClassId =
        typeof indexOrClassId === 'number'
          ? classes[indexOrClassId]?.id
          : indexOrClassId;
      const currentClass = classes.find((cls) => cls.id === currentClassId);

      if (!trimmedName || !currentClassId || currentClass?.name === trimmedName) {
        return;
      }

      setClasses((prev) =>
        prev.map((cls) => {
          const classId =
            typeof indexOrClassId === 'number'
              ? prev[indexOrClassId]?.id
              : indexOrClassId;
          return cls.id === classId ? { ...cls, name: trimmedName } : cls;
        }),
      );
      renameClass({
        classId: currentClassId,
        name: trimmedName,
      });
    };

    return {
      isLoading: !isInitialized,
      projectId,
      projectName,
      projectStatus,
      seedClass,
      addClass,
      removeClass,
      addSamplesToClass,
      removeSamplesFromClass,
      setProjectStatus,
      updateClassName,

      project,
      classes,
      totalClasses,
      totalSamples,
      classReadiness,
      requiredSamplesForTrain,
      readySampleContribution,
      trainProgress,
      isEmptyClass,
      isReadyForTrain,
    };
  },
);
