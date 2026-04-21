import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Input,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Form, defineConfig } from '~/components/form';
import ProjectCard from '~/components/project/ProjectCard';
import { listProjectClassSampleCounts } from '~/lib/db/domain/classes';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '~/lib/db/domain/projects';
import { exportProject } from '~/lib/project/project-export';
import { importProject } from '~/lib/project/project-import';
import { listProjectSamplePreviews } from '~/lib/db/domain/samples';
import { genProjectId } from '~/lib/project/id-generator';
import { toast } from 'sonner';
import {
  ANIMAL_ICON_OPTIONS,
  generateRandomProjectIdentity,
} from '~/lib/project/name';
import {
  DEFAULT_PROJECT_SETTINGS,
  parseProjectSettings,
  stringifyProjectSettings,
} from '~/lib/project/settings';
import { useAppProvider } from '../layout/AppProvider';
import { resolveSampleFilePath } from '~/lib/project/sample-path';

const PAGE_SIZE = 12;

const createProjectForm = defineConfig<{
  description: string;
  name: string;
  icon: string;
}>({
  name: {
    type: 'text',
    label: 'common.name',
    description: 'project.create.name',
    rules: {
      required: true,
      minLength: 1,
      maxLength: 200,
    },
    props: {
      size: 'lg',
      autoFocus: true,
    },
  },
  icon: {
    type: 'inline',
    label: 'common.icon',
    description: 'project.create.icon',
    render: ({ value, onChange, label, description }) => {
      return (
        <Input.Wrapper label={label} description={description}>
          <div className="flex flex-wrap gap-2 mt-2">
            {ANIMAL_ICON_OPTIONS.map((option) => (
              <ActionIcon
                size="input-md"
                variant={value === option.icon ? 'light' : 'default'}
                key={`${option.value}-${option.icon}`}
                onClick={() => {
                  onChange?.(option.icon);
                }}
                title={option.label}
              >
                {option.icon}
              </ActionIcon>
            ))}
          </div>
        </Input.Wrapper>
      );
    },
  },
  description: {
    type: 'longText',
    label: 'common.description',
    description: 'project.create.description',
    rules: {
      maxLength: 5000,
    },
    props: {
      preview: 'edit',
    },
  },
});

interface ProjectDirectoryProps {
  createRequested?: boolean;
}

function ProjectDirectory({ createRequested = false }: ProjectDirectoryProps) {
  const { appSettings, t } = useAppProvider();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createRequestDismissed, setCreateRequestDismissed] = useState(false);
  const [createProjectOpened, createProjectHandlers] = useDisclosure(false);
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [projectPendingDelete, setProjectPendingDelete] = useState<
    Awaited<ReturnType<typeof listProjects>>[number] | null
  >(null);
  const deferredSearch = useDeferredValue(search);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: ['projects', deferredSearch],
    queryFn: () => listProjects({ search: deferredSearch }),
  });
  const createProjectMutation = useMutation({
    mutationFn: async ({
      description,
      name,
      icon,
    }: {
      description: string;
      icon: string;
      name: string;
    }) => {
      return createProject({
        id: genProjectId(),
        description: description.trim() || null,
        name,
        settings: stringifyProjectSettings({
          ...DEFAULT_PROJECT_SETTINGS,
          icon,
          samplePathPattern: appSettings.samplePathPattern,
        }),
        status: 'draft',
      });
    },
    onSuccess: async (projectId) => {
      createProjectHandlers.close();
      await queryClient.invalidateQueries({ queryKey: ['projects'] });

      startTransition(() => {
        void navigate({
          to: '/projects/$projectId/label',
          params: { projectId },
        });
      });
    },
  });
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await deleteProject(projectId);
    },
    onSuccess: async () => {
      setProjectPendingDelete(null);
      setDeleteProjectName('');
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const projectPreviewSamplesQuery = useQuery({
    enabled: !!projectsQuery.data?.length,
    queryKey: [
      'project-sample-previews',
      projectsQuery.data?.map((item) => item.id).join(','),
    ],
    queryFn: async () =>
      listProjectSamplePreviews(
        projectsQuery.data?.map((item) => item.id) ?? [],
      ),
  });
  const projectClassCountsQuery = useQuery({
    enabled: !!projectsQuery.data?.length,
    queryKey: [
      'project-class-counts',
      projectsQuery.data?.map((item) => item.id).join(','),
    ],
    queryFn: () =>
      listProjectClassSampleCounts(
        projectsQuery.data?.map((item) => item.id) ?? [],
      ),
  });
  const projectPreviewSampleMap = useMemo(() => {
    const grouped = new Map<
      string,
      Awaited<ReturnType<typeof listProjectSamplePreviews>>
    >();

    projectPreviewSamplesQuery.data?.forEach((item) => {
      const list = grouped.get(item.projectId) ?? [];
      list.push(item);
      grouped.set(item.projectId, list);
    });

    return grouped;
  }, [projectPreviewSamplesQuery.data]);
  const projectClassCountMap = useMemo(() => {
    const grouped = new Map<string, number[]>();

    projectClassCountsQuery.data?.forEach((item) => {
      const list = grouped.get(item.projectId) ?? [];
      list.push(item.sampleCount);
      grouped.set(item.projectId, list);
    });

    return grouped;
  }, [projectClassCountsQuery.data]);
  const sortedProjects = useMemo(() => {
    const items = [...(projectsQuery.data ?? [])];

    items.sort((left, right) => {
      const leftSettings = parseProjectSettings(left.settings);
      const rightSettings = parseProjectSettings(right.settings);

      if (leftSettings.favorite !== rightSettings.favorite) {
        return leftSettings.favorite ? -1 : 1;
      }

      return (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });

    return items;
  }, [projectsQuery.data]);
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedProjects.slice(start, start + PAGE_SIZE);
  }, [safePage, sortedProjects]);
  const rangeStart =
    sortedProjects.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedProjects.length);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importProjectMutation = useMutation({
    mutationFn: async (file: File) => importProject(file),
    onSuccess: async (newProjectId) => {
      toast.success(t('project.directory.import.success'));
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      startTransition(() => {
        void navigate({
          to: '/projects/$projectId/label',
          params: { projectId: newProjectId },
        });
      });
    },
    onError: (error) => {
      toast.error(
        t('project.directory.import.error', {
          params: {
            message: error instanceof Error ? error.message : String(error),
          },
        }),
      );
    },
  });
  const exportProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const toastId = toast.loading(t('project.directory.export.loading'));
      try {
        const zipPath = await exportProject(projectId);
        toast.success(t('project.directory.export.success', { params: { zipPath } }), { id: toastId });
        return zipPath;
      } catch (error) {
        toast.error(
          t('project.directory.export.error', {
            params: {
              message: error instanceof Error ? error.message : String(error),
            },
          }),
          { id: toastId },
        );
        throw error;
      }
    },
  });
  const updateProjectSettingsMutation = useMutation({
    mutationFn: async ({
      projectId,
      settings,
    }: {
      projectId: string;
      settings: string;
    }) => {
      await updateProject({
        projectId,
        settings,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  useEffect(() => {
    setPage(1);
  }, [deferredSearch]);

  useEffect(() => {
    if (!projectPendingDelete) {
      setDeleteProjectName('');
    }
  }, [projectPendingDelete]);

  useEffect(() => {
    if (createRequested && !createRequestDismissed) {
      createProjectHandlers.open();
    }
    if (!createRequested) {
      setCreateRequestDismissed(false);
    }
  }, [createProjectHandlers, createRequestDismissed, createRequested]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
      <Modal
        size="lg"
        onClose={() => {
          createProjectHandlers.close();

          if (createRequested) {
            setCreateRequestDismissed(true);
            void navigate({
              to: '/projects',
              search: { create: false },
              replace: true,
            });
          }
        }}
        opened={createProjectOpened}
        withCloseButton={false}
      >
        <Form
          renderRoot={({ children, onSubmit }) => (
            <form className="space-y-3" onSubmit={onSubmit}>
              {children}
            </form>
          )}
          config={createProjectForm}
          defaultValues={{
            description: '',
            ...generateRandomProjectIdentity(),
          }}
          onSubmit={async (formData) => {
            await createProjectMutation.mutateAsync(formData);
          }}
        >
          <div className="mt-4 flex justify-end gap-3">
            <Button
              onClick={() => {
                createProjectHandlers.close();

                if (createRequested) {
                  setCreateRequestDismissed(true);
                  void navigate({
                    to: '/projects',
                    search: { create: false },
                    replace: true,
                  });
                }
              }}
              type="button"
              variant="default"
            >
              {t('common.cancel')}
            </Button>
            <Button loading={createProjectMutation.isPending} type="submit">
              {t('project.directory.createAction')}
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        centered
        trapFocus
        onClose={() => {
          setProjectPendingDelete(null);
        }}
        opened={projectPendingDelete != null}
        title={t('project.directory.deleteTitle')}
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            {projectPendingDelete
              ? t('project.confirmDelete', {
                  params: {
                    name: projectPendingDelete.name,
                  },
                })
              : ''}
          </Text>
          <TextInput
            autoFocus
            onChange={(event) =>
              setDeleteProjectName(event.currentTarget.value)
            }
            placeholder={projectPendingDelete?.name ?? ''}
            value={deleteProjectName}
          />
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setProjectPendingDelete(null);
              }}
              variant="default"
            >
              {t('common.cancel')}
            </Button>
            <Button
              color="red"
              disabled={deleteProjectName !== projectPendingDelete?.name}
              loading={deleteProjectMutation.isPending}
              onClick={() => {
                if (!projectPendingDelete) {
                  return;
                }

                deleteProjectMutation.mutate(projectPendingDelete.id);
              }}
            >
              {t('project.directory.deleteAction')}
            </Button>
          </div>
        </Stack>
      </Modal>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('header.projects')}
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            className="w-full sm:w-56"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder={t('project.directory.searchPlaceholder')}
            value={search}
          />
          <Button
            leftSection={<IconUpload className="size-4" />}
            loading={importProjectMutation.isPending}
            onClick={() => importFileRef.current?.click()}
            variant="default"
          >
            {t('project.directory.importAction')}
          </Button>
          <input
            ref={importFileRef}
            accept=".zip"
            aria-label={t('project.directory.importAriaLabel')}
            className="hidden"
            type="file"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                importProjectMutation.mutate(file);
              }
              e.currentTarget.value = '';
            }}
          />
          <Button
            onClick={() => {
              setCreateRequestDismissed(false);
              createProjectHandlers.open();
            }}
          >
            {t('project.directory.newAction')}
          </Button>
        </div>
      </div>

      {createProjectMutation.error ? (
        <Alert
          color="red"
          title={t('project.directory.createErrorTitle')}
          variant="light"
        >
          {createProjectMutation.error instanceof Error
            ? createProjectMutation.error.message
            : t('project.directory.createErrorFallback')}
        </Alert>
      ) : null}

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="sm" />
        </div>
      ) : null}

      {projectsQuery.error ? (
        <Alert
          color="red"
          title={t('project.directory.loadErrorTitle')}
          variant="light"
        >
          {projectsQuery.error instanceof Error
            ? projectsQuery.error.message
            : t('project.directory.loadErrorFallback')}
        </Alert>
      ) : null}

      {pagedProjects.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedProjects.map((project) => {
              const projectSettings = parseProjectSettings(project.settings);
              const classSampleCounts =
                projectClassCountMap.get(project.id) ?? [];
              const canTrain =
                project.classCount >= projectSettings.label.minClasses &&
                classSampleCounts.length >= projectSettings.label.minClasses &&
                classSampleCounts.every(
                  (sampleCount) =>
                    sampleCount >= projectSettings.label.minSamplesPerClass,
                );
              const canPlay = project.hasModel;

              return (
                <ProjectCard
                  canPlay={canPlay}
                  canTrain={canTrain}
                  icon={projectSettings.icon}
                  isFavorite={projectSettings.favorite}
                  isUpdatingFavorite={
                    updateProjectSettingsMutation.isPending &&
                    updateProjectSettingsMutation.variables?.projectId ===
                      project.id
                  }
                  key={project.id}
                  onDelete={() => {
                    setProjectPendingDelete(project);
                  }}
                  isExporting={
                    exportProjectMutation.isPending &&
                    exportProjectMutation.variables === project.id
                  }
                  onExport={() => {
                    exportProjectMutation.mutate(project.id);
                  }}
                  onOpen={() => {
                    void navigate({
                      to: '/projects/$projectId/label',
                      params: { projectId: project.id },
                    });
                  }}
                  onToggleFavorite={async () => {
                    await updateProjectSettingsMutation.mutateAsync({
                      projectId: project.id,
                      settings: stringifyProjectSettings({
                        ...projectSettings,
                        favorite: !projectSettings.favorite,
                      }),
                    });
                  }}
                  project={project}
                  sampleFilePaths={
                    projectPreviewSampleMap
                      .get(project.id)
                      ?.map((item) => resolveSampleFilePath(parseProjectSettings(project.settings).samplePathPattern, item.projectId, item.classId, item.fileName)) ?? []
                  }
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <Text c="dimmed" size="sm">
              {t('common.pagination.hint', {
                params: {
                  from: rangeStart,
                  to: rangeEnd,
                  totalItems: sortedProjects.length,
                  page: safePage,
                  totalPage: totalPages,
                },
              })}
            </Text>
            <Group gap="xs">
              <Button
                disabled={safePage === 1}
                leftSection={<IconChevronsLeft className="size-4" />}
                onClick={() => setPage(1)}
                variant="default"
              >
                {t('common.pagination.first')}
              </Button>
              <Button
                disabled={safePage === 1}
                leftSection={<IconChevronLeft className="size-4" />}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="default"
              >
                {t('common.pagination.previous')}
              </Button>
              <Button
                disabled={safePage === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                rightSection={<IconChevronRight className="size-4" />}
                variant="default"
              >
                {t('common.pagination.next')}
              </Button>
              <Button
                disabled={safePage === totalPages}
                onClick={() => setPage(totalPages)}
                rightSection={<IconChevronsRight className="size-4" />}
                variant="default"
              >
                {t('common.pagination.last')}
              </Button>
            </Group>
          </div>
        </>
      ) : null}

      {!projectsQuery.isLoading &&
      !projectsQuery.error &&
      !pagedProjects.length ? (
        <Paper className="p-8 text-center" radius="lg" withBorder>
          <Stack gap="xs">
            <Text fw={600}>
              {deferredSearch
                ? t('project.directory.emptySearchTitle')
                : t('project.directory.emptyTitle')}
            </Text>
            <Text c="dimmed" size="sm">
              {deferredSearch
                ? t('project.directory.emptySearchDescription')
                : t('project.directory.emptyDescription')}
            </Text>
          </Stack>
        </Paper>
      ) : null}
    </section>
  );
}

export default ProjectDirectory;
