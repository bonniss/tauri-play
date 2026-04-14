import { Box, Button, Group, Loader, Paper, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { IconCamera } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import UploadSamplesButton from "~/components/project/UploadSamplesButton"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import { getSamplePreviewSrc } from "~/lib/project/sample-preview"

export const Route = createFileRoute("/projects/$projectId/label/")({
  component: ProjectLabelPage,
})

function ProjectLabelPage() {
  const { classes, samples } = useProjectOne()
  const hasClasses = classes.length > 0
  const { data: samplePreviewMap, isLoading: isLoadingPreviews } = useQuery({
    queryKey: [
      "sample-preview-map",
      samples.map((sample) => `${sample.id}:${sample.filePath}`),
    ],
    queryFn: async () => {
      const entries = await Promise.all(
        samples.map(async (sample) => [
          sample.id,
          await getSamplePreviewSrc(sample.filePath),
        ]),
      )

      return Object.fromEntries(entries)
    },
    enabled: samples.length > 0,
  })

  const samplesByClass = classes.map((item) => ({
    id: item.id,
    name: item.name,
    sampleCount: item.sampleCount,
    samples: samples.filter((sample) => sample.classId === item.id),
  }))

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
            This project has {classes.length} classes and {samples.length}{" "}
            samples.
          </Text>
        )}
      </div>

      {hasClasses ? (
        <div className="mt-6 space-y-4">
          {samplesByClass.map((item, index) => (
            <details
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              key={item.id}
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <div className="flex items-center justify-between gap-4">
                  <span>{item.name}</span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.sampleCount} images
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
                        className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                        key={sample.id}
                      >
                        <img
                          alt={item.name}
                          className="aspect-square h-full w-full object-cover"
                          loading="lazy"
                          src={samplePreviewMap?.[sample.id]}
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
  )
}
