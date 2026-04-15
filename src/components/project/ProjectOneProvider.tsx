import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createProvider } from 'react-easy-provider';
import { ProjectClass, renameClass } from '~/lib/db/domain/classes';
import {
  getProjectWorkspace,
  ProjectRecord,
  updateProject,
} from '~/lib/db/domain/projects';
import { ProjectSample } from '~/lib/db/domain/samples';
import { genClassId, genSampleId } from '~/lib/project/id-generator';
import {
  parseProjectLabelSettingsFormValues,
  parseProjectPlaySettingsFormValues,
  parseProjectSettings,
  parseProjectTrainSettingsFormValues,
  ProjectLabelSettingsFormValues,
  ProjectPlaySettingsFormValues,
  ProjectTrainSettingsFormValues,
  projectLabelSettingsToFormValues,
  projectPlaySettingsToFormValues,
  projectTrainSettingsToFormValues,
  stringifyProjectSettings,
} from '~/lib/project/settings';

function getSampleIdFromFilePath(filePath: string) {
  const fileName = filePath.split('/').pop();

  if (!fileName) {
    return null;
  }

  const extensionIndex = fileName.lastIndexOf('.');

  if (extensionIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, extensionIndex);
}

export type ProjectOneClass = Pick<
  ProjectClass,
  'id' | 'projectId' | 'name' | 'description' | 'order'
> & {
  samples: ProjectSample[];
};

type ProjectOneSampleDraft = Pick<
  ProjectSample,
  | 'classId'
  | 'filePath'
  | 'mimeType'
  | 'width'
  | 'height'
  | 'originalFileName'
  | 'originalFilePath'
  | 'fileSize'
  | 'lastModifiedAt'
  | 'contentHash'
  | 'extraMetadata'
  | 'source'
> & {
  id?: string;
  createdAt?: string;
  order?: number;
};

export const [useProjectOne, ProjectOneProvider] = createProvider(
  (defaultValue?: { projectId: string }) => {
    const projectId = defaultValue?.projectId;
    const queryClient = useQueryClient();

    const [isInitialized, setIsInitialized] = useState(false);
    const [isApplyingLabelSettings, setIsApplyingLabelSettings] = useState(false);
    const [isApplyingPlaySettings, setIsApplyingPlaySettings] = useState(false);
    const [isApplyingTrainSettings, setIsApplyingTrainSettings] = useState(false);
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
    const projectDescription = project?.description ?? '';
    const projectStatus = project?.status;
    const projectSettings = parseProjectSettings(project?.settings);
    const projectIcon = projectSettings.icon;
    const labelSettings = projectSettings.label;
    const playSettings = projectSettings.play;
    const trainSettings = projectSettings.train;

    const totalClasses = classes.length;
    const totalSamples = classes.reduce(
      (acc, cls) => acc + cls.samples.length,
      0,
    );
    const classReadiness = classes.map((cls) => ({
      classId: cls.id,
      isOverLimit:
        labelSettings.maxSamplesPerClass != null &&
        cls.samples.length > labelSettings.maxSamplesPerClass,
      sampleCount: cls.samples.length,
      targetMaxSampleCount: labelSettings.maxSamplesPerClass,
      targetSampleCount: labelSettings.minSamplesPerClass,
      progress:
        Math.min(cls.samples.length, labelSettings.minSamplesPerClass) /
        labelSettings.minSamplesPerClass,
      isReady: cls.samples.length >= labelSettings.minSamplesPerClass,
    }));
    const hasReachedMaxClasses =
      labelSettings.maxClasses != null && totalClasses >= labelSettings.maxClasses;
    const isOverClassLimit =
      labelSettings.maxClasses != null && totalClasses > labelSettings.maxClasses;
    const requiredSamplesForTrain =
      Math.max(totalClasses, labelSettings.minClasses) *
      labelSettings.minSamplesPerClass;
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
      totalClasses >= labelSettings.minClasses &&
      !isOverClassLimit &&
      classReadiness.every((item) => item.isReady && !item.isOverLimit);

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
            id: sample.id ?? getSampleIdFromFilePath(sample.filePath) ?? genSampleId(),
            projectId,
            classId,
            filePath: sample.filePath,
            mimeType: sample.mimeType ?? null,
            width: sample.width ?? null,
            height: sample.height ?? null,
            originalFileName: sample.originalFileName ?? null,
            originalFilePath: sample.originalFilePath ?? null,
            fileSize: sample.fileSize ?? null,
            lastModifiedAt: sample.lastModifiedAt ?? null,
            contentHash: sample.contentHash ?? null,
            extraMetadata: sample.extraMetadata ?? null,
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

    const getLabelSettingsFormValues = (): ProjectLabelSettingsFormValues =>
      projectLabelSettingsToFormValues(labelSettings);

    const getTrainSettingsFormValues = (): ProjectTrainSettingsFormValues =>
      projectTrainSettingsToFormValues(trainSettings);

    const getPlaySettingsFormValues = (): ProjectPlaySettingsFormValues =>
      projectPlaySettingsToFormValues(playSettings);

    const applyLabelSettings = async (
      values: ProjectLabelSettingsFormValues,
    ) => {
      const nextLabelSettings = parseProjectLabelSettingsFormValues(values);
      const nextProjectSettings = {
        ...projectSettings,
        label: nextLabelSettings,
      };
      const nextSettings = stringifyProjectSettings(nextProjectSettings);

      if (nextSettings === (project?.settings ?? '')) {
        return;
      }

      setIsApplyingLabelSettings(true);

      try {
        setProject((current) =>
          current
            ? {
                ...current,
                settings: nextSettings,
                updatedAt: new Date().toISOString(),
              }
            : current,
        );

        await updateProject({
          projectId,
          settings: nextSettings,
        });
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
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
        throw error;
      } finally {
        setIsApplyingLabelSettings(false);
      }
    };

    const applyTrainSettings = async (
      values: ProjectTrainSettingsFormValues,
    ) => {
      const nextTrainSettings = parseProjectTrainSettingsFormValues(values);
      const nextProjectSettings = {
        ...projectSettings,
        train: nextTrainSettings,
      };
      const nextSettings = stringifyProjectSettings(nextProjectSettings);

      if (nextSettings === (project?.settings ?? '')) {
        return;
      }

      setIsApplyingTrainSettings(true);

      try {
        setProject((current) =>
          current
            ? {
                ...current,
                settings: nextSettings,
                updatedAt: new Date().toISOString(),
              }
            : current,
        );

        await updateProject({
          projectId,
          settings: nextSettings,
        });
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
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
        throw error;
      } finally {
        setIsApplyingTrainSettings(false);
      }
    };

    const applyPlaySettings = async (
      values: ProjectPlaySettingsFormValues,
    ) => {
      const nextPlaySettings = parseProjectPlaySettingsFormValues(values);
      const nextProjectSettings = {
        ...projectSettings,
        play: nextPlaySettings,
      };
      const nextSettings = stringifyProjectSettings(nextProjectSettings);

      if (nextSettings === (project?.settings ?? '')) {
        return;
      }

      setIsApplyingPlaySettings(true);

      try {
        setProject((current) =>
          current
            ? {
                ...current,
                settings: nextSettings,
                updatedAt: new Date().toISOString(),
              }
            : current,
        );

        await updateProject({
          projectId,
          settings: nextSettings,
        });
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
      } catch (error) {
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
        throw error;
      } finally {
        setIsApplyingPlaySettings(false);
      }
    };

    return {
      isLoading: !isInitialized,
      isApplyingLabelSettings,
      isApplyingPlaySettings,
      isApplyingTrainSettings,
      projectId,
      projectName,
      projectIcon,
      projectDescription,
      projectStatus,
      seedClass,
      addClass,
      removeClass,
      addSamplesToClass,
      removeSamplesFromClass,
      setProjectStatus,
      updateClassName,
      getLabelSettingsFormValues,
      getPlaySettingsFormValues,
      getTrainSettingsFormValues,
      applyLabelSettings,
      applyPlaySettings,
      applyTrainSettings,

      project,
      projectSettings,
      labelSettings,
      playSettings,
      trainSettings,
      classes,
      totalClasses,
      totalSamples,
      classReadiness,
      hasReachedMaxClasses,
      isOverClassLimit,
      requiredSamplesForTrain,
      readySampleContribution,
      trainProgress,
      isEmptyClass,
      isReadyForTrain,
    };
  },
);
