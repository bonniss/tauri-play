import {
  Alert,
  ActionIcon,
  Button,
  Divider,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  IconPhoto,
  IconPlayerPlay,
  IconTrash,
  IconWaveSawTool,
} from '@tabler/icons-react';
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Form, defineConfig } from '~/components/form';
import {
  createProject,
  deleteProject,
  listProjects,
} from '~/lib/db/domain/projects';
import { listProjectSamplePreviews } from '~/lib/db/domain/samples';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';
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

export const Route = createFileRoute('/')({
  component: HomePage,
});

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

function HomePage() {
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    if (!projectPendingDelete) {
      setDeleteProjectName('');
    }
  }, [projectPendingDelete]);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
      <Modal
        onClose={createProjectHandlers.close}
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
              onClick={createProjectHandlers.close}
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
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            className="w-full sm:w-48"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search projects by name"
            value={search}
          />
          <Button
            onClick={() => {
              const nextSeed = generateRandomProjectIdentity();
              setProjectSeed(nextSeed);
              setSelectedProjectIcon(nextSeed.icon);
              createProjectHandlers.open();
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

      {projectsQuery.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.map((project) => (
            <Paper className="p-5" key={project.id} radius="lg" withBorder>
              <Stack gap="md">
                <ProjectCardPreview
                  icon={parseProjectSettings(project.settings).icon}
                  projectId={project.id}
                  sampleFilePaths={
                    projectPreviewSampleMap.get(project.id)?.map((item) => item.filePath) ??
                    []
                  }
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h2 className="truncate text-lg font-semibold leading-tight">
                      {project.name}
                    </h2>
                    <Text c="dimmed" lineClamp={2} size="sm">
                      {project.description || 'No description yet.'}
                    </Text>
                  </div>
                  <ActionIcon
                    aria-label={`Delete ${project.name}`}
                    color="red"
                    onClick={() => {
                      setProjectPendingDelete(project);
                    }}
                    variant="subtle"
                  >
                    <IconTrash className="size-4" />
                  </ActionIcon>
                </div>

                <Divider />

                <div className="space-y-2">
                  <ProjectMetaItem label="Classes" value={String(project.classCount)} />
                  <ProjectMetaItem label="Samples" value={String(project.sampleCount)} />
                  <ProjectMetaItem
                    label="Updated"
                    value={formatRelativeTime(project.updatedAt)}
                  />
                  <ProjectMetaItem
                    label="Trained"
                    value={project.trainedAt ? formatRelativeTime(project.trainedAt) : '-'}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    component={Link}
                    leftSection={<IconWaveSawTool className="size-4" />}
                    params={{ projectId: project.id } as never}
                    to="/projects/$projectId/train"
                    variant="light"
                  >
                    Train
                  </Button>
                  {project.hasModel ? (
                    <Button
                      component={Link}
                      leftSection={<IconPlayerPlay className="size-4" />}
                      params={{ projectId: project.id } as never}
                      to="/projects/$projectId/play"
                      variant="light"
                    >
                      Play
                    </Button>
                  ) : null}
                  <Button
                    component={Link}
                    params={{ projectId: project.id } as never}
                    to="/projects/$projectId/label"
                    variant="default"
                  >
                    Open
                  </Button>
                </div>
              </Stack>
            </Paper>
          ))}
        </div>
      ) : null}

      {!projectsQuery.isLoading &&
      !projectsQuery.error &&
      !projectsQuery.data?.length ? (
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

function ProjectMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text fw={500} size="sm">
        {value}
      </Text>
    </div>
  );
}

function ProjectCardPreview({
  icon,
  projectId,
  sampleFilePaths,
}: {
  icon: string;
  projectId: string;
  sampleFilePaths: string[];
}) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const seededSamplePaths = useMemo(
    () => [...sampleFilePaths].sort((left, right) => seededSampleScore(projectId, left) - seededSampleScore(projectId, right)),
    [projectId, sampleFilePaths],
  );

  useEffect(() => {
    let cancelled = false;
    let nextUrls: string[] = [];

    if (!seededSamplePaths.length) {
      setPreviewUrls([]);
      return;
    }

    void Promise.all(seededSamplePaths.slice(0, 5).map((filePath) => createSamplePreviewUrl(filePath)))
      .then((urls) => {
        if (cancelled) {
          urls.forEach((url) => revokeSamplePreviewUrl(url));
          return;
        }

        nextUrls = urls;
        setPreviewUrls(urls);
      });

    return () => {
      cancelled = true;
      nextUrls.forEach((url) => revokeSamplePreviewUrl(url));
    };
  }, [seededSamplePaths]);

  if (!previewUrls.length) {
    return (
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]">
        <div className="absolute left-4 top-4 text-3xl leading-none">{icon}</div>
        <IconPhoto className="size-16 text-zinc-300 dark:text-zinc-700" stroke={1.5} />
      </div>
    );
  }

  return (
    <div className="group relative h-40 overflow-hidden rounded-2xl border border-zinc-200 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]">
      <div className="absolute left-4 top-4 z-10 text-3xl leading-none drop-shadow-sm">
        {icon}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {previewUrls.map((url, index) => {
          const spreadIndex = index - (previewUrls.length - 1) / 2;
          const offset = spreadIndex * 24;
          const hoverOffset = spreadIndex * 38;
          const rotate = spreadIndex * 7;

          return (
            <div
              className="absolute h-28 w-24 overflow-hidden rounded-xl border border-white/70 bg-white shadow-lg transition-transform duration-300 ease-out [transform:translateX(var(--offset))_rotate(var(--rotate))] group-hover:[transform:translateX(var(--hover-offset))_rotate(var(--rotate))]"
              key={url}
              style={{
                ['--hover-offset' as string]: `${hoverOffset}px`,
                ['--offset' as string]: `${offset}px`,
                ['--rotate' as string]: `${rotate}deg`,
                zIndex: index + 1,
              }}
            >
              <img
                alt={`Project preview ${index + 1}`}
                className="size-full object-cover"
                src={url}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function seededSampleScore(projectId: string, samplePath: string) {
  const source = `${projectId}:${samplePath}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function formatRelativeTime(input: string) {
  const now = Date.now();
  const target = new Date(input).getTime();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMs < 60_000) {
    return formatter.format(Math.round(diffMs / 1000), 'second');
  }

  if (absMs < 3_600_000) {
    return formatter.format(Math.round(diffMs / 60_000), 'minute');
  }

  if (absMs < 86_400_000) {
    return formatter.format(Math.round(diffMs / 3_600_000), 'hour');
  }

  if (absMs < 2_592_000_000) {
    return formatter.format(Math.round(diffMs / 86_400_000), 'day');
  }

  if (absMs < 31_536_000_000) {
    return formatter.format(Math.round(diffMs / 2_592_000_000), 'month');
  }

  return formatter.format(Math.round(diffMs / 31_536_000_000), 'year');
}

export default HomePage;
