import { Box, Button, Group, Loader, Paper, Text } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
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
  const totalSamples = classes.reduce((count, item) => count + item.samples.length, 0);
  const samples = useMemo(
    () => classes.flatMap((item) => item.samples),
    [classes],
  );
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [samplePreviewMap, setSamplePreviewMap] = useState<
    Record<string, string>
  >({});

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
        <Text c="dimmed" size="sm">
          {hasClasses
            ? `This project has ${classes.length} classes and ${totalSamples} samples.`
            : "Create the first class to start collecting images for this project."}
        </Text>
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
          {classes.map((item, index) => (
            <details
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              key={item.id}
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center justify-between gap-4">
                  <ContentEditable
                    as="span"
                    aria-label={`Class name ${item.name}`}
                    className="min-w-0 flex-1 truncate rounded px-1 py-0.5"
                    focusedClassName="bg-zinc-100 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700"
                    onBlur={(value) => {
                      updateClassName(item.id, value);
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                    }}
                    value={item.name}
                  />
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.samples.length} images
                  </span>
                </div>
              </summary>

              <Box className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                {isLoadingPreviews ? (
                  <div className="flex items-center gap-2">
                    <Loader size="sm" />
                    <Text c="dimmed" size="sm">
                      Loading images...
                    </Text>
                  </div>
                ) : item.samples.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {item.samples.map((sample) => (
                      <div
                        className="size-16 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
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
                ) : (
                  <Text c="dimmed" size="sm">
                    No images in this class yet.
                  </Text>
                )}
              </Box>
            </details>
          ))}
        </div>
      ) : null}
    </Paper>
  );
}
