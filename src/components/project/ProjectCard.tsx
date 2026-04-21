import { ActionIcon, Menu, Paper, Text } from '@mantine/core';
import {
  IconDots,
  IconDownload,
  IconHeart,
  IconHeartFilled,
  IconPhoto,
  IconTrash,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import type { ProjectListItem } from '~/lib/db/domain/projects';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';
import { IconDataPlay, IconDataTrain, IconView } from '../icon/semantic';
import { useAppProvider } from '../layout/AppProvider';

interface ProjectCardProps {
  canPlay: boolean;
  canTrain: boolean;
  icon: string;
  isExporting: boolean;
  isFavorite: boolean;
  isUpdatingFavorite: boolean;
  onDelete: () => void;
  onExport: () => void;
  onOpen: () => void;
  onToggleFavorite: () => void | Promise<void>;
  project: ProjectListItem;
  sampleFilePaths: string[];
}

const ProjectCard: FunctionComponent<ProjectCardProps> = ({
  canPlay,
  canTrain,
  icon,
  isExporting,
  isFavorite,
  isUpdatingFavorite,
  onDelete,
  onExport,
  onOpen,
  onToggleFavorite,
  project,
  sampleFilePaths,
}) => {
  const { locale, t } = useAppProvider();

  return (
    <Paper
      className="group cursor-pointer overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:hover:border-zinc-700"
      onClick={onOpen}
      radius="lg"
      withBorder
    >
      <div className="-mx-5 -mt-5">
        <ProjectCardPreview
          icon={icon}
          isFavorite={isFavorite}
          isUpdatingFavorite={isUpdatingFavorite}
          onToggleFavorite={onToggleFavorite}
          projectId={project.id}
          sampleFilePaths={sampleFilePaths}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mt-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold leading-tight transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
            {project.name}
          </h2>
        </div>

        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Menu position="bottom-end" shadow="md" withinPortal>
            <Menu.Target>
              <ActionIcon
                aria-label={t('project.card.actions', {
                  params: { name: project.name },
                })}
                variant="subtle"
              >
                <IconDots className="size-5" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                component={Link}
                leftSection={<IconView className="size-4" />}
                params={{ projectId: project.id } as never}
                to="/projects/$projectId/label"
              >
                {t('project.card.open')}
              </Menu.Item>
              <Menu.Item
                component={Link}
                disabled={!canTrain}
                leftSection={<IconDataTrain className="size-4" />}
                params={{ projectId: project.id } as never}
                to="/projects/$projectId/train"
              >
                {t('project.card.train')}
              </Menu.Item>
              <Menu.Item
                component={Link}
                disabled={!canPlay}
                leftSection={<IconDataPlay className="size-4" />}
                params={{ projectId: project.id } as never}
                search={{ mode: 'auto' } as never}
                to="/p/$projectId"
              >
                {t('project.play.demoTitle')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                disabled={isExporting}
                leftSection={<IconDownload className="size-4" />}
                onClick={onExport}
              >
                {isExporting
                  ? t('project.card.exporting')
                  : t('common.export')}
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash className="size-4" />}
                onClick={onDelete}
              >
                {t('common.delete')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <Text c="dimmed" size="sm">
          {project.sampleCount > 0
            ? t('project.asset', {
                params: {
                  classes: project.classCount,
                  samples: project.sampleCount,
                },
              })
            : t('common.empty')}
        </Text>
        {project.trainedAt ? (
          <Text c="dimmed" size="sm">
            {t('project.lastTrained', {
              params: { ts: formatRelativeTime(project.trainedAt, locale) },
            })}
          </Text>
        ) : (
          <Text c="dimmed" size="sm">
            {t('project.notTrained')}
          </Text>
        )}
      </div>
    </Paper>
  );
};

function ProjectCardPreview({
  icon,
  isFavorite,
  isUpdatingFavorite,
  onToggleFavorite,
  projectId,
  sampleFilePaths,
}: {
  icon: string;
  isFavorite: boolean;
  isUpdatingFavorite: boolean;
  onToggleFavorite: () => void | Promise<void>;
  projectId: string;
  sampleFilePaths: string[];
}) {
  const { t } = useAppProvider();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const seededSamplePaths = useMemo(
    () =>
      [...sampleFilePaths].sort(
        (left, right) =>
          seededSampleScore(projectId, left) -
          seededSampleScore(projectId, right),
      ),
    [projectId, sampleFilePaths],
  );

  useEffect(() => {
    let cancelled = false;
    let nextUrls: string[] = [];

    if (!seededSamplePaths.length) {
      setPreviewUrls([]);
      return;
    }

    void Promise.all(
      seededSamplePaths
        .slice(0, 5)
        .map((filePath) => createSamplePreviewUrl(filePath)),
    ).then((urls) => {
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

  const btnFavorite = (
    <ActionIcon
      aria-label={
        isFavorite
          ? t('project.card.removeFavorite')
          : t('project.card.addFavorite')
      }
      loading={isUpdatingFavorite}
      onClick={(event) => {
        event.stopPropagation();
        void onToggleFavorite();
      }}
      size="lg"
      variant="transparent"
    >
      {isFavorite ? (
        <IconHeartFilled className="size-7 text-red-500 transition-all duration-200 motion-preset-pop" />
      ) : (
        <IconHeart className="size-7 hover:text-red-500" />
      )}
    </ActionIcon>
  );

  if (!previewUrls.length) {
    return (
      <div className="relative flex h-44 w-full items-center justify-center overflow-hidden border-b border-zinc-200 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]">
        <div className="absolute left-4 top-4 text-3xl leading-none">
          {icon}
        </div>
        <div className="absolute right-4 top-4 z-10">{btnFavorite}</div>
        <IconPhoto
          className="size-16 text-zinc-300 dark:text-zinc-700"
          stroke={1.5}
        />
      </div>
    );
  }

  return (
    <div className="group/preview relative h-44 w-full overflow-hidden border-b border-zinc-200 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]">
      <div className="absolute left-4 top-4 z-10 text-3xl leading-none drop-shadow-sm">
        {icon}
      </div>
      <div className="absolute right-4 top-4 z-10">{btnFavorite}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        {previewUrls.map((url, index) => {
          const spreadIndex = index - (previewUrls.length - 1) / 2;
          const offset = spreadIndex * 24;
          const hoverOffset = spreadIndex * 38;
          const rotate = spreadIndex * 7;

          return (
            <div
              className="absolute h-28 w-24 overflow-hidden rounded-xl border border-white/70 bg-white shadow-lg transition-transform duration-300 ease-out [transform:translateX(var(--offset))_rotate(var(--rotate))] group-hover/preview:[transform:translateX(var(--hover-offset))_rotate(var(--rotate))]"
              key={url}
              style={{
                ['--hover-offset' as string]: `${hoverOffset}px`,
                ['--offset' as string]: `${offset}px`,
                ['--rotate' as string]: `${rotate}deg`,
                zIndex: index + 1,
              }}
            >
              <img
                alt={t('project.card.previewAlt', {
                  params: { index: index + 1 },
                })}
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

function formatRelativeTime(input: string, locale: string) {
  const now = Date.now();
  const target = new Date(input).getTime();
  const diffMs = target - now;
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

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

export default ProjectCard;
