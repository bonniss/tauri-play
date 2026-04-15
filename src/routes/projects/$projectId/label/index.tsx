import { ActionIcon, Box, Button, Group, Loader, Paper } from '@mantine/core';
import { IconCamera, IconChevronRight } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import ContentEditable from '~/components/headless/ContentEditable';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import UploadSamplesButton from '~/components/project/UploadSamplesButton';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';

export const Route = createFileRoute('/projects/$projectId/label/')({
  component: ProjectLabelPage,
});

function ProjectLabelPage() {
  const { classes, updateClassName } = useProjectOne();
  const hasClasses = classes.length > 0;
  const [openClassMap, setOpenClassMap] = useState<Record<string, boolean>>({});
  const samples = useMemo(
    () => classes.flatMap((item) => item.samples),
    [classes],
  );
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [samplePreviewMap, setSamplePreviewMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    setOpenClassMap((current) => {
      const next: Record<string, boolean> = {};

      classes.forEach((item, index) => {
        next[item.id] = current[item.id] ?? index === 0;
      });

      return next;
    });
  }, [classes]);

  useEffect(() => {
    let cancelled = false;
    let nextPreviewMap: Record<string, string> = {};

    if (!samples.length) {
      setSamplePreviewMap({});
      setIsLoadingPreviews(false);
      return;
    }

    setIsLoadingPreviews(true);

    void Promise.all(
      samples
        .filter((sample) => sample.id)
        .map(async (sample) => [
          sample.id!,
          await createSamplePreviewUrl(sample.filePath),
        ] as const),
    )
      .then((entries) => {
        if (cancelled) {
          entries.forEach(([, url]) => revokeSamplePreviewUrl(url));
          return;
        }

        nextPreviewMap = Object.fromEntries(entries);
        setSamplePreviewMap(nextPreviewMap);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPreviews(false);
        }
      });

    return () => {
      cancelled = true;
      Object.values(nextPreviewMap).forEach((url) => revokeSamplePreviewUrl(url));
    };
  }, [samples]);

  return (
    <Paper className="p-6" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Label</h2>
        <Group>
          <Button
            leftSection={<IconCamera className="size-4" />}
            variant="default"
          >
            Camera
          </Button>
          <UploadSamplesButton buttonLabel="Upload" />
        </Group>
      </div>

      {hasClasses ? (
        <div className="mt-6 space-y-4">
          {classes.map((item) => (
            <div
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              key={item.id}
            >
              <div className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-2">
                    <ActionIcon
                      aria-label={openClassMap[item.id] ? 'Collapse class' : 'Expand class'}
                      onClick={() => {
                        setOpenClassMap((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }));
                      }}
                      size="sm"
                      variant="subtle"
                    >
                      <IconChevronRight
                        className={openClassMap[item.id] ? 'rotate-90 transition-transform' : 'transition-transform'}
                        size={16}
                        stroke={1.8}
                      />
                    </ActionIcon>
                  <ContentEditable
                    as="span"
                    aria-label={`Class name ${item.name}`}
                    className="inline-block w-fit max-w-full truncate rounded px-1 py-0.5"
                    focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                    onBlur={(value) => {
                      updateClassName(item.id, value);
                    }}
                    value={item.name}
                  />
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.samples.length}
                  </span>
                  </div>
                  <UploadSamplesButton
                    buttonLabel="Upload"
                    classId={item.id}
                  />
                </div>
              </div>

              {openClassMap[item.id] ? (
              <Box className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                {isLoadingPreviews ? (
                  <div className="flex items-center gap-2">
                    <Loader size="sm" />
                  </div>
                ) : item.samples.length ? (
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    }}
                  >
                    {item.samples.map((sample) => (
                      <div
                        className="aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                        key={sample.id}
                      >
                        <img
                          alt={item.name}
                          className="size-full object-cover"
                          loading="lazy"
                          src={samplePreviewMap?.[sample.id!]}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </Box>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Paper>
  );
}
