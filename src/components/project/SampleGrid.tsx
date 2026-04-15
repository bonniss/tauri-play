import {
  ActionIcon,
  Button,
  Loader,
  Modal,
  Popover,
  ScrollArea,
  Skeleton,
  Table,
  Text,
} from "@mantine/core"
import {
  IconChevronLeft,
  IconChevronRight,
  IconTrash,
} from "@tabler/icons-react"
import {
  FunctionComponent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ProjectSample } from "~/lib/db/domain/samples"
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from "~/lib/project/sample-preview"

interface SampleGridProps {
  activeSampleId?: string
  defaultActiveSampleId?: string
  emptyState?: ReactNode
  loading?: boolean
  minItemSize?: number
  onActiveSampleChange?: (sampleId: string | null) => void
  onDeleteSample?: (sample: ProjectSample) => Promise<void> | void
  samples: ProjectSample[]
}

const GRID_GAP_PX = 12

const SampleGrid: FunctionComponent<SampleGridProps> = ({
  activeSampleId,
  defaultActiveSampleId,
  emptyState = null,
  loading = false,
  minItemSize = 80,
  onActiveSampleChange,
  onDeleteSample,
  samples,
}) => {
  const isActiveControlled = activeSampleId !== undefined
  const [internalActiveSampleId, setInternalActiveSampleId] = useState<string | null>(
    defaultActiveSampleId ?? samples[0]?.id ?? null,
  )
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [displayedSampleId, setDisplayedSampleId] = useState<string | null>(null)
  const [isDeletingSample, setIsDeletingSample] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const [columnCount, setColumnCount] = useState(1)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const thumbnailRefMap = useRef<Record<string, HTMLButtonElement | null>>({})
  const shouldFocusActiveRef = useRef(false)
  const previousSamplesRef = useRef<ProjectSample[]>(samples)
  const resolvedActiveSampleId = isActiveControlled
    ? activeSampleId ?? null
    : internalActiveSampleId
  const lightboxSampleIndex = useMemo(
    () => samples.findIndex((sample) => sample.id === displayedSampleId),
    [displayedSampleId, samples],
  )
  const lightboxSample =
    lightboxSampleIndex >= 0 ? samples[lightboxSampleIndex] : null

  function setResolvedActiveSampleId(sampleId: string | null) {
    if (!isActiveControlled) {
      setInternalActiveSampleId(sampleId)
    }

    onActiveSampleChange?.(sampleId)
  }

  useEffect(() => {
    let cancelled = false
    let nextPreviewMap: Record<string, string> = {}

    if (!samples.length) {
      setPreviewMap({})
      setIsLoadingPreviews(false)
      return
    }

    setIsLoadingPreviews(true)

    void Promise.all(
      samples.map(async (sample) => [
        sample.id,
        await createSamplePreviewUrl(sample.filePath),
      ] as const),
    )
      .then((entries) => {
        if (cancelled) {
          entries.forEach(([, url]) => revokeSamplePreviewUrl(url))
          return
        }

        nextPreviewMap = Object.fromEntries(entries)
        setPreviewMap(nextPreviewMap)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPreviews(false)
        }
      })

    return () => {
      cancelled = true
      Object.values(nextPreviewMap).forEach((url) => revokeSamplePreviewUrl(url))
    }
  }, [samples])

  useEffect(() => {
    const previousSamples = previousSamplesRef.current
    const previousIds = previousSamples.map((sample) => sample.id)
    const hasResolvedActiveSample = samples.some(
      (sample) => sample.id === resolvedActiveSampleId,
    )

    if (!hasResolvedActiveSample) {
      setResolvedActiveSampleId(samples[0]?.id ?? null)
    }

    if (displayedSampleId && !samples.some((sample) => sample.id === displayedSampleId)) {
      const removedIndex = previousIds.indexOf(displayedSampleId)
      const fallbackSample =
        samples[Math.min(removedIndex, samples.length - 1)] ?? null

      if (fallbackSample) {
        setDisplayedSampleId(fallbackSample.id)
      } else {
        setIsDeleteConfirmOpen(false)
        setShowMetadata(false)
        setIsLightboxOpen(false)
      }
      setResolvedActiveSampleId(fallbackSample?.id ?? null)
    }

    previousSamplesRef.current = samples
  }, [displayedSampleId, resolvedActiveSampleId, samples])

  useEffect(() => {
    const gridElement = gridRef.current

    if (!gridElement) {
      return
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextColumns = Math.max(
        1,
        Math.floor(
          (entry.contentRect.width + GRID_GAP_PX) / (minItemSize + GRID_GAP_PX),
        ),
      )

      setColumnCount(nextColumns)
    })

    resizeObserver.observe(gridElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [minItemSize])

  useEffect(() => {
    if (!shouldFocusActiveRef.current || !resolvedActiveSampleId) {
      return
    }

    thumbnailRefMap.current[resolvedActiveSampleId]?.focus()
    shouldFocusActiveRef.current = false
  }, [resolvedActiveSampleId])

  useEffect(() => {
    if (!lightboxSample) {
      return
    }

    function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        moveLightbox(-1)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        moveLightbox(1)
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown)

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown)
    }
  }, [lightboxSample])

  function moveActiveSample(nextIndex: number) {
    const normalizedIndex = Math.max(0, Math.min(nextIndex, samples.length - 1))
    const nextSample = samples[normalizedIndex]

    if (!nextSample) {
      return
    }

    shouldFocusActiveRef.current = true
    setResolvedActiveSampleId(nextSample.id)
  }

  function moveLightbox(delta: number) {
    if (!lightboxSample || !samples.length) {
      return
    }

    const nextIndex = Math.max(
      0,
      Math.min(lightboxSampleIndex + delta, samples.length - 1),
    )
    const nextSample = samples[nextIndex]

    if (!nextSample) {
      return
    }

    setDisplayedSampleId(nextSample.id)
    setIsDeleteConfirmOpen(false)
    setResolvedActiveSampleId(nextSample.id)
  }

  function openLightbox(sampleId: string) {
    setDisplayedSampleId(sampleId)
    setIsLightboxOpen(true)
    setIsDeleteConfirmOpen(false)
    setResolvedActiveSampleId(sampleId)
    setShowMetadata(false)
  }

  function closeLightbox() {
    if (resolvedActiveSampleId) {
      shouldFocusActiveRef.current = true
    }

    setIsDeleteConfirmOpen(false)
    setShowMetadata(false)
    setIsLightboxOpen(false)
  }

  async function handleDeleteSample() {
    if (!lightboxSample || !onDeleteSample || isDeletingSample) {
      return
    }

    setIsDeletingSample(true)

    try {
      await onDeleteSample(lightboxSample)
    } finally {
      setIsDeletingSample(false)
    }
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    sampleIndex: number,
    sampleId: string,
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      moveActiveSample(sampleIndex - 1)
      return
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      moveActiveSample(sampleIndex + 1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActiveSample(sampleIndex - columnCount)
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActiveSample(sampleIndex + columnCount)
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      moveActiveSample(0)
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      moveActiveSample(samples.length - 1)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      openLightbox(sampleId)
      return
    }

    if (event.key === "Delete" && onDeleteSample) {
      event.preventDefault()
      openLightbox(sampleId)
    }
  }

  if (!samples.length && !loading) {
    return <>{emptyState}</>
  }

  return (
    <>
      <ScrollArea.Autosize
        mah={samples.length > 120 ? 520 : undefined}
        offsetScrollbars={samples.length > 120}
        scrollbarSize={4}
      >
        <div
          className="grid gap-3"
          ref={gridRef}
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${minItemSize}px, 1fr))`,
          }}
        >
          {samples.map((sample, index) => {
            const isActive = sample.id === resolvedActiveSampleId

            return (
              <button
                aria-label={`Open sample ${index + 1}`}
                aria-pressed={isActive}
                className={[
                  "aspect-square overflow-hidden rounded-md border bg-zinc-50 transition",
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900"
                    : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950",
                ].join(" ")}
                key={sample.id}
                onClick={() => {
                  openLightbox(sample.id)
                }}
                onFocus={() => {
                  setResolvedActiveSampleId(sample.id)
                }}
                onKeyDown={(event) => {
                  handleThumbnailKeyDown(event, index, sample.id)
                }}
                ref={(node) => {
                  thumbnailRefMap.current[sample.id] = node
                }}
                tabIndex={isActive || (resolvedActiveSampleId == null && index === 0) ? 0 : -1}
                type="button"
              >
                {previewMap[sample.id] ? (
                  <img
                    alt={sample.originalFileName ?? sample.className ?? "Sample"}
                    className="size-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={previewMap[sample.id]}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Loader size="sm" />
                  </div>
                )}
              </button>
            )
          })}

          {loading ? (
            <SampleGridSkeleton
              columnCount={columnCount}
              isLoadingPreviews={isLoadingPreviews}
            />
          ) : null}
        </div>
      </ScrollArea.Autosize>

      <Modal
        centered
        keepMounted
        onClose={closeLightbox}
        opened={isLightboxOpen}
        size="auto"
        title=""
        withCloseButton={false}
      >
        {lightboxSample ? (
          <div className="flex max-w-[min(90vw,1100px)] flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Text fw={600} truncate>
                    {lightboxSample.originalFileName ?? lightboxSample.className ?? "Sample"}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {lightboxSampleIndex + 1} / {samples.length}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ActionIcon
                  aria-label="Previous sample"
                  disabled={lightboxSampleIndex <= 0}
                  onClick={() => {
                    moveLightbox(-1)
                  }}
                  variant="default"
                >
                  <IconChevronLeft size={18} stroke={1.8} />
                </ActionIcon>
                <ActionIcon
                  aria-label="Next sample"
                  disabled={lightboxSampleIndex >= samples.length - 1}
                  onClick={() => {
                    moveLightbox(1)
                  }}
                  variant="default"
                >
                  <IconChevronRight size={18} stroke={1.8} />
                </ActionIcon>
              </div>
            </div>

            <div className="flex max-h-[75vh] min-h-60 min-w-[min(70vw,960px)] items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-950">
              {previewMap[lightboxSample.id] ? (
                <img
                  alt={lightboxSample.originalFileName ?? lightboxSample.className ?? "Sample"}
                  className="max-h-[75vh] max-w-full object-contain"
                  src={previewMap[lightboxSample.id]}
                />
              ) : (
                <Loader size="sm" />
              )}
            </div>

            {showMetadata ? (
              <div className="rounded-lg border border-zinc-200 bg-white/85 p-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/85">
                <Table
                  className="text-xs"
                  highlightOnHover={false}
                  horizontalSpacing="sm"
                  verticalSpacing={6}
                >
                  <Table.Tbody>
                    <MetadataRow
                      label="Name"
                      value={lightboxSample.originalFileName ?? "-"}
                    />
                    <MetadataRow
                      label="Path"
                      value={lightboxSample.originalFilePath ?? lightboxSample.filePath}
                    />
                    <MetadataRow
                      label="Mime"
                      value={lightboxSample.mimeType ?? "-"}
                    />
                    <MetadataRow
                      label="Size"
                      value={
                        lightboxSample.fileSize != null
                          ? `${lightboxSample.fileSize.toLocaleString()} B`
                          : "-"
                      }
                    />
                    <MetadataRow
                      label="Dimensions"
                      value={
                        lightboxSample.width && lightboxSample.height
                          ? `${lightboxSample.width} x ${lightboxSample.height}`
                          : "-"
                      }
                    />
                    <MetadataRow
                      label="Modified"
                      value={lightboxSample.lastModifiedAt ?? "-"}
                    />
                    <MetadataRow
                      label="Hash"
                      value={lightboxSample.contentHash ?? "-"}
                    />
                    <MetadataRow
                      label="Source"
                      value={lightboxSample.source}
                    />
                  </Table.Tbody>
                </Table>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={() => {
                  setShowMetadata((current) => !current)
                  setIsDeleteConfirmOpen(false)
                }}
                variant="default"
              >
                {showMetadata ? "Hide Meta" : "Show Meta"}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={closeLightbox}
                  variant="default"
                >
                  Close
                </Button>
                {onDeleteSample ? (
                  <Popover
                    onDismiss={() => {
                      setIsDeleteConfirmOpen(false)
                    }}
                    opened={isDeleteConfirmOpen}
                    position="top-end"
                    shadow="md"
                    trapFocus
                    withArrow
                  >
                    <Popover.Target>
                      <Button
                        color="red"
                        leftSection={<IconTrash size={16} stroke={1.8} />}
                        onClick={() => {
                          setIsDeleteConfirmOpen((current) => !current)
                        }}
                        variant="light"
                      >
                        Delete
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <div className="w-56 space-y-3">
                        <Text size="sm">Delete this sample?</Text>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setIsDeleteConfirmOpen(false)
                            }}
                            size="xs"
                            variant="default"
                          >
                            Cancel
                          </Button>
                          <Button
                            color="red"
                            data-autofocus
                            loading={isDeletingSample}
                            onClick={() => {
                              void handleDeleteSample().finally(() => {
                                setIsDeleteConfirmOpen(false)
                              })
                            }}
                            size="xs"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </Popover.Dropdown>
                  </Popover>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

function SampleGridSkeleton({
  columnCount,
  isLoadingPreviews,
}: {
  columnCount: number
  isLoadingPreviews: boolean
}) {
  const skeletonCount = Math.max(columnCount * 3, 12)

  return Array.from({ length: skeletonCount }, (_, index) => (
    <div
      className="aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      key={`sample-skeleton-${index}`}
    >
      <Skeleton
        animate={isLoadingPreviews}
        className="size-full"
        radius="md"
      />
    </div>
  ))
}

function MetadataRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Table.Tr>
      <Table.Td className="w-28 whitespace-nowrap px-0 py-1 text-zinc-500 dark:text-zinc-400">
        {label}
      </Table.Td>
      <Table.Td className="break-all px-0 py-1 text-zinc-900 dark:text-zinc-100">
        {value}
      </Table.Td>
    </Table.Tr>
  )
}

export default SampleGrid
