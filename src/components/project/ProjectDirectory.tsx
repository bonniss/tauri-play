import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Form, defineConfig } from '~/components/form';
import ProjectCard from '~/components/project/ProjectCard';
import { listProjectClassSampleCounts } from '~/lib/db/domain/classes';
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '~/lib/db/domain/projects';
import { listProjectSamplePreviews } from '~/lib/db/domain/samples';
import { genProjectId } from '~/lib/project/id-generator';
import {
  ANIMAL_ICON_OPTIONS,
  generateRandomProjectIdentity,
} from '~/lib/project/name';
import {
  DEFAULT_PROJECT_SETTINGS,
  parseProjectSettings,
  stringifyProjectSettings,
} from '~/lib/project/settings';

const PAGE_SIZE = 12;

const createProjectForm = defineConfig<{
  description: string;
  name: string;
}>({
  name: {
    type: 'text',
    label: 'Name',
    rules: {
      required: true,
    },
    props: {
      autoFocus: true,
    },
  },
  description: {
    type: 'longText',
    label: 'Description',
  },
});

interface ProjectDirectoryProps {
  createRequested?: boolean;
}

function ProjectDirectory({ createRequested = false }: ProjectDirectoryProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [projectSeed, setProjectSeed] = useState(
    generateRandomProjectIdentity(),
  );
  const [selectedProjectIcon, setSelectedProjectIcon] = useState(
    projectSeed.icon,
  );
  const [createProjectOpened, createProjectHandlers] = useDisclosure(false);
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [projectPendingDelete, setProjectPendingDelete] = useState<Awaited<
    ReturnType<typeof listProjects>
  >[number] | null>(null);
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
    queryKey: ['project-sample-previews', projectsQuery.data?.map((item) => item.id).join(',')],
    queryFn: async () =>
      listProjectSamplePreviews(projectsQuery.data?.map((item) => item.id) ?? []),
  });
  const projectClassCountsQuery = useQuery({
    enabled: !!projectsQuery.data?.length,
    queryKey: ['project-class-counts', projectsQuery.data?.map((item) => item.id).join(',')],
    queryFn: () =>
      listProjectClassSampleCounts(projectsQuery.data?.map((item) => item.id) ?? []),
  });
  const projectPreviewSampleMap = useMemo(() => {
    const grouped = new Map<string, Awaited<
      ReturnType<typeof listProjectSamplePreviews>
    >>();

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

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

    return items;
  }, [projectsQuery.data]);
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProjects = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedProjects.slice(start, start + PAGE_SIZE);
  }, [safePage, sortedProjects]);
  const rangeStart = sortedProjects.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedProjects.length);
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
    if (createRequested) {
      createProjectHandlers.open();
    }
  }, [createProjectHandlers, createRequested]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
      <Modal
        onClose={() => {
          createProjectHandlers.close();

          if (createRequested) {
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
            name: projectSeed.name,
          }}
          onSubmit={async (values) => {
            await createProjectMutation.mutateAsync({
              ...values,
              icon: selectedProjectIcon,
            });
          }}
        >
          <div className="space-y-2">
            <Text c="dimmed" size="sm">
              Icon
            </Text>
            <div className="grid grid-cols-7 gap-2">
              {ANIMAL_ICON_OPTIONS.map((option) => (
                <button
                  className={`flex h-11 items-center justify-center rounded-xl border text-xl transition-colors ${
                    selectedProjectIcon === option.icon
                      ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800'
                      : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'
                  }`}
                  key={`${option.value}-${option.icon}`}
                  onClick={() => {
                    setSelectedProjectIcon(option.icon);
                  }}
                  title={option.label}
                  type="button"
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              onClick={() => {
                createProjectHandlers.close();

                if (createRequested) {
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
              Cancel
            </Button>
            <Button loading={createProjectMutation.isPending} type="submit">
              Create Project
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        centered
        onClose={() => {
          setProjectPendingDelete(null);
        }}
        opened={projectPendingDelete != null}
        title="Delete project?"
      >
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            {projectPendingDelete
              ? `Type "${projectPendingDelete.name}" to confirm deletion. This will remove the project and all local files.`
              : ''}
          </Text>
          <TextInput
            autoFocus
            onChange={(event) => setDeleteProjectName(event.currentTarget.value)}
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
              Cancel
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
              Delete Project
            </Button>
          </div>
        </Stack>
      </Modal>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <Text c="dimmed" size="sm">
            Manage datasets, training runs, and playable demos.
          </Text>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            className="w-full sm:w-56"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search projects by name"
            value={search}
          />
          <Button
            onClick={() => {
              const nextSeed = generateRandomProjectIdentity();
              setProjectSeed(nextSeed);
              setSelectedProjectIcon(nextSeed.icon);
              void navigate({
                to: '/projects',
                search: { create: true },
              });
            }}
          >
            New Project
          </Button>
        </div>
      </div>

      {createProjectMutation.error ? (
        <Alert color="red" title="Failed to create project" variant="light">
          {createProjectMutation.error instanceof Error
            ? createProjectMutation.error.message
            : 'Unknown error while creating the project.'}
        </Alert>
      ) : null}

      {projectsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader size="sm" />
        </div>
      ) : null}

      {projectsQuery.error ? (
        <Alert color="red" title="Failed to load projects" variant="light">
          {projectsQuery.error instanceof Error
            ? projectsQuery.error.message
            : 'Unknown error while loading projects.'}
        </Alert>
      ) : null}

      {pagedProjects.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pagedProjects.map((project) => {
              const projectSettings = parseProjectSettings(project.settings);
              const classSampleCounts = projectClassCountMap.get(project.id) ?? [];
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
                    updateProjectSettingsMutation.variables?.projectId === project.id
                  }
                  key={project.id}
                  onDelete={() => {
                    setProjectPendingDelete(project);
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
                    projectPreviewSampleMap.get(project.id)?.map((item) => item.filePath) ??
                    []
                  }
                />
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <Text c="dimmed" size="sm">
              {rangeStart}-{rangeEnd} of {sortedProjects.length} projects · page {safePage}/
              {totalPages}
            </Text>
            <Group gap="xs">
              <Button
                disabled={safePage === 1}
                leftSection={<IconChevronsLeft className="size-4" />}
                onClick={() => setPage(1)}
                variant="default"
              >
                First
              </Button>
              <Button
                disabled={safePage === 1}
                leftSection={<IconChevronLeft className="size-4" />}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                variant="default"
              >
                Prev
              </Button>
              <Button
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                rightSection={<IconChevronRight className="size-4" />}
                variant="default"
              >
                Next
              </Button>
              <Button
                disabled={safePage === totalPages}
                onClick={() => setPage(totalPages)}
                rightSection={<IconChevronsRight className="size-4" />}
                variant="default"
              >
                Last
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
                ? 'No projects match this search.'
                : 'No projects yet.'}
            </Text>
            <Text c="dimmed" size="sm">
              {deferredSearch
                ? 'Try a different project name.'
                : 'Create the first project to start collecting labels and samples.'}
            </Text>
          </Stack>
        </Paper>
      ) : null}
    </section>
  );
}

export default ProjectDirectory;
