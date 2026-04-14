import { Box, Button, Group, Loader, Paper, Text } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import UploadSamplesButton from '~/components/project/UploadSamplesButton';

export const Route = createFileRoute('/projects/$projectId/label/')({
  component: ProjectLabelPage,
});

function ProjectLabelPage() {
  const { classes } = useProjectOne();
  const hasClasses = classes.length > 0;
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [samplePreviewMap, setSamplePreviewMap] = useState<
    Record<string, string>
  >({});

  return (
    <Paper className="p-6" withBorder>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Label</h2>
        {!hasClasses ? (
          <>
            <Text c="dimmed" size="sm">
              Create the first class to start collecting images for this
              project.
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
          </>
        ) : (
          <Text c="dimmed" size="sm">
            This project has {classes.length} classes and{' '}
            {classes.reduce((a, b) => a + b.samples.length, 0)} samples.
          </Text>
        )}
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
                  <span>{item.name}</span>
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
