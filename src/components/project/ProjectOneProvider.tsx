import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createProvider } from 'react-easy-provider';
import { ProjectClass, renameClass } from '~/lib/db/domain/classes';
import {
  getLatestProjectTrainLog,
  getProjectModel,
} from '~/lib/db/domain/models';
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

    const projectModelQuery = useQuery({
      queryKey: ['project-model', projectId],
      queryFn: () => getProjectModel(projectId),
    });
    const latestTrainLogQuery = useQuery({
      queryKey: ['project-train-log', projectId],
      queryFn: () => getLatestProjectTrainLog(projectId),
    });

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
    const projectModel = projectModelQuery.data ?? null;
    const latestTrainLog = latestTrainLogQuery.data ?? null;
    const latestTrainRunSettings = useMemo(() => {
      if (!latestTrainLog?.settingsSnapshot) {
        return null;
      }

      try {
        return JSON.parse(latestTrainLog.settingsSnapshot) as {
          epochs?: number;
        };
      } catch {
        return null;
      }
    }, [latestTrainLog?.settingsSnapshot]);
    const latestEpochEvents = latestTrainLog?.events.filter(
      (event) => event.type === 'epoch',
    );
    const latestEpoch =
      latestEpochEvents && latestEpochEvents.length > 0
        ? latestEpochEvents[latestEpochEvents.length - 1]
        : null;
    const plannedTrainEpochs =
      latestTrainRunSettings?.epochs &&
      Number.isFinite(latestTrainRunSettings.epochs)
        ? Math.max(1, latestTrainRunSettings.epochs)
        : trainSettings.epochs;
    const trainRunProgress = latestTrainLog
      ? latestTrainLog.status === 'completed'
        ? 1
        : Math.min((latestEpoch?.epoch ?? 0) / plannedTrainEpochs, 1)
      : 0;
    const trainStatus = !isReadyForTrain
      ? 'not_ready'
      : latestTrainLog?.status === 'started'
        ? 'training'
        : projectModel
          ? 'trained'
          : latestTrainLog?.status === 'failed'
            ? 'failed'
            : 'not_trained';
    const trainStatusLabel =
      trainStatus === 'not_ready'
        ? 'Need more label data'
        : trainStatus === 'training'
          ? 'Training in progress'
          : trainStatus === 'trained'
            ? 'Training succeeded'
            : trainStatus === 'failed'
              ? 'Training failed'
              : 'Not trained yet';
    const trainStatusColor =
      trainStatus === 'trained'
        ? 'teal'
        : trainStatus === 'training'
          ? 'blue'
          : trainStatus === 'failed'
            ? 'red'
            : 'yellow';
    const trainedAtLabel = projectModel
      ? new Date(projectModel.trainedAt).toLocaleString()
      : null;
    const trainStatusDescription =
      trainStatus === 'not_ready'
        ? `Need at least ${labelSettings.minClasses} classes and ${labelSettings.minSamplesPerClass} samples per class before training.`
        : trainStatus === 'training'
          ? `Current run: ${Math.round(trainRunProgress * 100)}% complete.`
          : trainStatus === 'trained'
            ? `Last trained at ${trainedAtLabel}.`
            : trainStatus === 'failed'
              ? 'The latest training run failed. Review the train page and try again.'
              : 'Dataset is ready, but no successful training run exists yet.';
    const trainNavProgress =
      trainStatus === 'training' || trainStatus === 'trained' || trainStatus === 'failed'
        ? trainRunProgress
        : trainProgress;
    const canPlay = projectModel != null;
    const playGuardTitle = !isReadyForTrain
      ? 'Train data is not ready yet.'
      : !canPlay
        ? trainStatus === 'failed'
          ? 'The latest training run failed.'
          : trainStatus === 'training'
            ? 'Training is still in progress.'
            : 'No trained model is available yet.'
        : null;
    const playGuardDescription = !isReadyForTrain
      ? `Finish labeling at least ${labelSettings.minClasses} classes with ${labelSettings.minSamplesPerClass} samples each before opening Play.`
      : !canPlay
        ? trainStatus === 'failed'
          ? 'Run training again successfully before opening the demo page.'
          : trainStatus === 'training'
            ? 'Wait for the current training run to finish successfully before opening the demo page.'
            : 'Start a successful training run from the Train page before opening the demo page.'
        : null;

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
      projectModel,
      latestTrainLog,
      isLoadingTrainState:
        projectModelQuery.isLoading || latestTrainLogQuery.isLoading,
      classes,
      totalClasses,
      totalSamples,
      classReadiness,
      hasReachedMaxClasses,
      isOverClassLimit,
      requiredSamplesForTrain,
      readySampleContribution,
      trainProgress,
      trainRunProgress,
      trainNavProgress,
      isEmptyClass,
      isReadyForTrain,
      trainStatus,
      trainStatusLabel,
      trainStatusColor,
      trainStatusDescription,
      canPlay,
      playGuardTitle,
      playGuardDescription,
    };
  },
);
