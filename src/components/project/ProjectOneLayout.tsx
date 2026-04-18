import { ActionIcon, Progress, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCircleCheck,
  IconLoader2,
  IconPencil,
  IconX,
} from '@tabler/icons-react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { FunctionComponent, ReactNode } from 'react';
import ContentEditable from '~/components/headless/ContentEditable';
import MarkdownViewer from '../shared/MarkdownViewer';
import { IconDataLabel, IconDataPlay, IconDataTrain } from '../icon/semantic';
import { useAppProvider } from '../layout/AppProvider';
import ProjectEditModal from './ProjectEditModal';
import { useProjectOne } from './ProjectOneProvider';

interface ProjectOneLayoutProps {}

const ProjectOneLayout: FunctionComponent<ProjectOneLayoutProps> = () => {
  const { t } = useAppProvider();
  const [editOpened, editHandlers] = useDisclosure(false);
  const {
    projectId,
    classes,
    totalSamples,
    project,
    projectIcon,
    projectName,
    projectDescription,
    projectSettings,
    classReadiness,
    trainProgress,
    trainNavProgress,
    trainStatus,
    updateClassName,
    canPlay,
    refreshProject,
  } = useProjectOne();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <section className="flex min-h-[calc(100vh-60px)]">
      <aside className="sticky top-[60px] flex h-[calc(100vh-60px)] w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 dark:border-zinc-700">
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-700">
          <Text c="dimmed" className="font-mono" size="xs">
            {projectId}
          </Text>
          <div className="mt-2 flex items-start gap-2">
            <div className="pt-0.5 text-xl leading-none">{projectIcon}</div>
            <h2 className="min-w-0 flex-1 py-0.5 text-base font-semibold leading-tight text-zinc-950 dark:text-zinc-50">
              {projectName}
            </h2>
            <ActionIcon
              color="gray"
              mt={2}
              onClick={editHandlers.open}
              size="sm"
              variant="subtle"
            >
              <IconPencil stroke={1.8} />
            </ActionIcon>
          </div>
          {projectDescription ? (
            <MarkdownViewer className="mt-1 text-xs">{projectDescription}</MarkdownViewer>
          ) : (
            <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500">
              {t('project.sidebar.descriptionPlaceholder')}
            </p>
          )}
        </div>

        <nav className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-700">
          <div className="space-y-0.5">
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/label`}
              icon={IconDataLabel}
              label={t('project.nav.label')}
              projectId={projectId}
              to="/projects/$projectId/label"
            />
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/train`}
              icon={IconDataTrain}
              label={t('project.nav.train')}
              progress={trainNavProgress}
              projectId={projectId}
              trainStatus={trainStatus}
              to="/projects/$projectId/train"
            />
            <ProjectNavItem
              current={pathname === `/projects/${projectId}/play`}
              disabled={!canPlay}
              icon={IconDataPlay}
              label={t('project.nav.play')}
              projectId={projectId}
              to="/projects/$projectId/play"
            />
          </div>
        </nav>

        <div className="px-4 py-4">
          <Text
            c="dimmed"
            fw={600}
            size="xs"
            tt="uppercase"
            className="tracking-widest"
          >
            {t('project.sidebar.dataset')}
          </Text>
          <div className="mt-3 space-y-3">
            <SidebarDatasetItem
              label={t('project.sidebar.allImages')}
              progress={trainProgress}
              trailing={`${totalSamples}`}
            />
            {classes.map((projectClass) => {
              const readiness = classReadiness.find(
                (item) => item.classId === projectClass.id,
              );

              return (
                <SidebarDatasetItem
                  key={projectClass.id}
                  editableLabel={
                    <ContentEditable
                      as="span"
                      aria-label={`Class name ${projectClass.name}`}
                      className="font-semibold font-serif hover:ring-1 ring-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/75 inline-block w-fit max-w-full truncate rounded px-1 py-0.5"
                      focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                      onBlur={(value) => {
                        updateClassName(projectClass.id, value);
                      }}
                      value={projectClass.name}
                    />
                  }
                  progress={readiness?.progress ?? 0}
                  trailing={`${projectClass.samples.length}`}
                />
              );
            })}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>

      <ProjectEditModal
        currentSettings={project?.settings ?? ''}
        defaultValues={{
          name: projectName,
          description: projectDescription,
          icon: projectSettings.icon,
        }}
        onClose={editHandlers.close}
        onSuccess={refreshProject}
        opened={editOpened}
        projectId={projectId}
      />
    </section>
  );
};

function ProjectNavItem({
  current,
  disabled = false,
  icon: Icon,
  label,
  progress,
  projectId,
  trainStatus,
  to,
}: {
  current: boolean;
  disabled?: boolean;
  icon: FunctionComponent<{ className?: string; stroke?: number }>;
  label: string;
  progress?: number;
  projectId: string;
  trainStatus?: string;
  to:
    | '/projects/$projectId'
    | '/projects/$projectId/label'
    | '/projects/$projectId/train'
    | '/projects/$projectId/play';
}) {
  const rightSection =
    trainStatus === 'training' ? (
      <div className="flex items-center gap-1">
        <IconLoader2
          className="size-3.5 animate-spin text-blue-500"
          stroke={1.8}
        />
        <span className="text-xs text-zinc-400">
          {Math.round((progress ?? 0) * 100)}%
        </span>
      </div>
    ) : trainStatus === 'trained' ? (
      <IconCircleCheck className="size-3.5 text-teal-500" stroke={1.8} />
    ) : trainStatus === 'failed' ? (
      <IconX className="size-3.5 text-red-500" stroke={1.8} />
    ) : null;

  const base =
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors';
  const active =
    'bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50';
  const inactive =
    'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200';
  const disabledCls = 'pointer-events-none opacity-40';

  if (disabled) {
    return (
      <div className={`${base} ${inactive} ${disabledCls}`}>
        <Icon className="size-4 shrink-0" stroke={1.8} />
        <span className="flex-1">{label}</span>
      </div>
    );
  }

  return (
    <Link
      className={`${base} ${current ? active : inactive}`}
      params={{ projectId } as never}
      to={to}
    >
      <Icon className="size-4 shrink-0" stroke={1.8} />
      <span className="flex-1">{label}</span>
      {rightSection}
    </Link>
  );
}

function SidebarDatasetItem({
  label,
  editableLabel,
  leading,
  progress,
  trailing,
}: {
  label?: string;
  editableLabel?: ReactNode;
  leading?: ReactNode;
  progress: number;
  trailing?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
        {leading && (
          <div className="flex size-6 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500">
            {leading}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="text-sm">{editableLabel ?? label}</span>
        </div>
        <Text c="dimmed" size="xs">
          {trailing}
        </Text>
      </div>
      <Progress
        color={progress >= 1 ? 'teal' : 'blue'}
        radius="xl"
        size="sm"
        value={progress * 100}
      />
    </div>
  );
}

export default ProjectOneLayout;
