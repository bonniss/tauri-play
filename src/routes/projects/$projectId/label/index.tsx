import { ActionIcon, Box, Button, Group, Paper } from '@mantine/core';
import { IconCamera, IconChevronRight } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ContentEditable from '~/components/headless/ContentEditable';
import SampleGrid from '~/components/project/SampleGrid';
import { useProjectOne } from '~/components/project/ProjectOneProvider';
import UploadSamplesButton from '~/components/project/UploadSamplesButton';
import { deleteSample } from '~/lib/db/domain/samples';
import { deleteSampleFile } from '~/lib/project/sample-storage';

export const Route = createFileRoute('/projects/$projectId/label/')({
  component: ProjectLabelPage,
});

function ProjectLabelPage() {
  const { addSamplesToClass, classes, removeSamplesFromClass, updateClassName } =
    useProjectOne();
  const hasClasses = classes.length > 0;
  const [openClassMap, setOpenClassMap] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const deleteSampleMutation = useMutation({
    mutationFn: async ({
      filePath,
      sampleId,
    }: {
      filePath: string;
      sampleId: string;
    }) => {
      await deleteSample(sampleId);

      try {
        await deleteSampleFile(filePath);
      } catch (error) {
        console.warn('Failed to delete sample file.', error);
        toast.warning('Deleted sample record, but failed to remove local file.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  useEffect(() => {
    setOpenClassMap((current) => {
      const next: Record<string, boolean> = {};

      classes.forEach((item, index) => {
        next[item.id] = current[item.id] ?? index === 0;
      });

      return next;
    });
  }, [classes]);

  async function handleDeleteSample(sample: (typeof classes)[number]['samples'][number]) {
    removeSamplesFromClass(sample.classId, [sample.id]);

    try {
      await deleteSampleMutation.mutateAsync({
        filePath: sample.filePath,
        sampleId: sample.id,
      });
    } catch (error) {
      addSamplesToClass(sample.classId, [sample]);
      throw error;
    }
  }

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
                <SampleGrid
                  onDeleteSample={handleDeleteSample}
                  samples={item.samples}
                />
              </Box>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </Paper>
  );
}
