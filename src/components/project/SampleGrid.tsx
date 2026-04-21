import {
  ActionIcon,
  Badge,
  Button,
  Modal,
  Popover,
  ScrollArea,
  Skeleton,
  Table,
  Text,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconTrash,
} from '@tabler/icons-react';
import clsx from 'clsx';
import {
  FunctionComponent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppProvider } from '~/components/layout/AppProvider';
import { ProjectSample } from '~/lib/db/domain/samples';
import { colorFromString } from '~/lib/project/class-color';
import {
  createSamplePreviewUrl,
  revokeSamplePreviewUrl,
} from '~/lib/project/sample-preview';
import { resolveSampleFilePath } from '~/lib/project/sample-path';

interface SampleGridProps {
  actions?: ReactNode;
  activeSampleId?: string;
  classColorMap?: Record<string, string>;
  classIndexMap?: Record<string, number>;
  defaultActiveSampleId?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  minItemSize?: number;
  onActiveSampleChange?: (sampleId: string | null) => void;
  onDeleteSample?: (sample: ProjectSample) => Promise<void> | void;
  onDeleteSamples?: (samples: ProjectSample[]) => Promise<void>;
  samplePathPattern: string;
  samples: ProjectSample[];
}

const GRID_GAP_PX = 12;
const SAMPLE_PAGE_SIZE = 60;

const SampleGrid: FunctionComponent<SampleGridProps> = ({
  actions,
  activeSampleId,
  classColorMap,
  classIndexMap,
  defaultActiveSampleId,
  emptyState = null,
  loading = false,
  minItemSize = 80,
  onActiveSampleChange,
  onDeleteSample,
  onDeleteSamples,
  samplePathPattern,
  samples,
}) => {
  const { t } = useAppProvider();
  const isActiveControlled = activeSampleId !== undefined;
  const [internalActiveSampleId, setInternalActiveSampleId] = useState<
    string | null
  >(defaultActiveSampleId ?? samples[0]?.id ?? null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [displayedSampleId, setDisplayedSampleId] = useState<string | null>(
    null,
  );
  const [isDeletingSample, setIsDeletingSample] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [columnCount, setColumnCount] = useState(1);
  const [visibleCount, setVisibleCount] = useState(SAMPLE_PAGE_SIZE);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [newSampleIds, setNewSampleIds] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefMap = useRef<Record<string, HTMLButtonElement | null>>({});
  const shouldFocusActiveRef = useRef(false);
  const previousSamplesRef = useRef<ProjectSample[]>(samples);
  const knownSampleIdsRef = useRef<Set<string>>(new Set(samples.map((s) => s.id)));
  const resolvedActiveSampleId = isActiveControlled
    ? (activeSampleId ?? null)
    : internalActiveSampleId;
  const visibleSamples = useMemo(
    () => samples.slice(0, visibleCount),
    [samples, visibleCount],
  );
  const hasMoreSamples = visibleSamples.length < samples.length;
  const lightboxSampleIndex = useMemo(
    () => samples.findIndex((sample) => sample.id === displayedSampleId),
    [displayedSampleId, samples],
  );
  const lightboxSample =
    lightboxSampleIndex >= 0 ? samples[lightboxSampleIndex] : null;

  function setResolvedActiveSampleId(sampleId: string | null) {
    if (!isActiveControlled) {
      setInternalActiveSampleId(sampleId);
    }

    onActiveSampleChange?.(sampleId);
  }

  function loadMoreSamples() {
    setVisibleCount((current) =>
      Math.min(current + SAMPLE_PAGE_SIZE, samples.length),
    );
  }

  useEffect(() => {
    setVisibleCount(() =>
      Math.min(
        samples.length,
        Math.max(
          SAMPLE_PAGE_SIZE,
          resolvedActiveSampleId
            ? Math.ceil(
                (samples.findIndex(
                  (sample) => sample.id === resolvedActiveSampleId,
                ) +
                  1) /
                  SAMPLE_PAGE_SIZE,
              ) * SAMPLE_PAGE_SIZE
            : SAMPLE_PAGE_SIZE,
        ),
      ),
    );
  }, [resolvedActiveSampleId, samples]);

  useEffect(() => {
    let cancelled = false;
    let nextPreviewMap: Record<string, string> = {};

    if (!visibleSamples.length) {
      setPreviewMap({});
      setIsLoadingPreviews(false);
      return;
    }

    setIsLoadingPreviews(true);

    void Promise.all(
      visibleSamples.map(
        async (sample) =>
          [sample.id, await createSamplePreviewUrl(resolveSampleFilePath(samplePathPattern, sample.projectId, sample.classId, sample.fileName))] as const,
      ),
    )
      .then((entries) => {
        if (cancelled) {
          entries.forEach(([, url]) => revokeSamplePreviewUrl(url));
          return;
        }

        nextPreviewMap = Object.fromEntries(entries);
        setPreviewMap(nextPreviewMap);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPreviews(false);
        }
      });

    return () => {
      cancelled = true;
      Object.values(nextPreviewMap).forEach((url) =>
        revokeSamplePreviewUrl(url),
      );
    };
  }, [visibleSamples]);

  useEffect(() => {
    const previousSamples = previousSamplesRef.current;
    const previousIds = previousSamples.map((sample) => sample.id);
    const hasResolvedActiveSample = samples.some(
      (sample) => sample.id === resolvedActiveSampleId,
    );

    if (!hasResolvedActiveSample) {
      setResolvedActiveSampleId(samples[0]?.id ?? null);
    }

    if (
      displayedSampleId &&
      !samples.some((sample) => sample.id === displayedSampleId)
    ) {
      const removedIndex = previousIds.indexOf(displayedSampleId);
      const fallbackSample =
        samples[Math.min(removedIndex, samples.length - 1)] ?? null;

      if (fallbackSample) {
        setDisplayedSampleId(fallbackSample.id);
      } else {
        setIsDeleteConfirmOpen(false);
        setShowMetadata(false);
        setIsLightboxOpen(false);
      }
      setResolvedActiveSampleId(fallbackSample?.id ?? null);
    }

    previousSamplesRef.current = samples;

    if (selectedIds.size > 0) {
      const sampleIdSet = new Set(samples.map((s) => s.id));
      setSelectedIds((prev) => {
        const next = new Set([...prev].filter((id) => sampleIdSet.has(id)));
        return next.size === prev.size ? prev : next;
      });
    }
  }, [displayedSampleId, resolvedActiveSampleId, samples]);

  useEffect(() => {
    const gridElement = gridRef.current;

    if (!gridElement) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextColumns = Math.max(
        1,
        Math.floor(
          (entry.contentRect.width + GRID_GAP_PX) / (minItemSize + GRID_GAP_PX),
        ),
      );

      setColumnCount(nextColumns);
    });

    resizeObserver.observe(gridElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [minItemSize]);

  useEffect(() => {
    if (!shouldFocusActiveRef.current || !resolvedActiveSampleId) {
      return;
    }

    thumbnailRefMap.current[resolvedActiveSampleId]?.focus();
    shouldFocusActiveRef.current = false;
  }, [resolvedActiveSampleId]);

  useEffect(() => {
    const knownIds = knownSampleIdsRef.current;
    const addedIds = samples.filter((s) => !knownIds.has(s.id)).map((s) => s.id);
    knownSampleIdsRef.current = new Set(samples.map((s) => s.id));

    if (addedIds.length === 0) return;

    setNewSampleIds((prev) => new Set([...prev, ...addedIds]));

    const timer = setTimeout(() => {
      setNewSampleIds((prev) => {
        const next = new Set(prev);
        addedIds.forEach((id) => next.delete(id));
        return next;
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [samples]);

  useEffect(() => {
    if (!lightboxSample) {
      return;
    }

    function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveLightbox(-1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveLightbox(1);
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
    };
  }, [lightboxSample]);

  function moveActiveSample(nextIndex: number) {
    const normalizedIndex = Math.max(
      0,
      Math.min(nextIndex, samples.length - 1),
    );
    const nextSample = samples[normalizedIndex];

    if (!nextSample) {
      return;
    }

    shouldFocusActiveRef.current = true;
    setResolvedActiveSampleId(nextSample.id);
  }

  function moveLightbox(delta: number) {
    if (!lightboxSample || !samples.length) {
      return;
    }

    const nextIndex = Math.max(
      0,
      Math.min(lightboxSampleIndex + delta, samples.length - 1),
    );
    const nextSample = samples[nextIndex];

    if (!nextSample) {
      return;
    }

    setDisplayedSampleId(nextSample.id);
    setIsDeleteConfirmOpen(false);
    setResolvedActiveSampleId(nextSample.id);
  }

  function openLightbox(sampleId: string) {
    setDisplayedSampleId(sampleId);
    setIsLightboxOpen(true);
    setIsDeleteConfirmOpen(false);
    setResolvedActiveSampleId(sampleId);
    setShowMetadata(false);
  }

  function closeLightbox() {
    if (resolvedActiveSampleId) {
      shouldFocusActiveRef.current = true;
    }

    setIsDeleteConfirmOpen(false);
    setShowMetadata(false);
    setIsLightboxOpen(false);
  }

  function toggleSelectMode() {
    setIsSelectMode((v) => !v);
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }

  function handleThumbnailSelect(
    sampleId: string,
    index: number,
    shiftKey: boolean,
  ) {
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = visibleSamples.slice(start, end + 1).map((s) => s.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(sampleId)) {
          next.delete(sampleId);
        } else {
          next.add(sampleId);
        }
        return next;
      });
      setLastSelectedIndex(index);
    }
  }

  async function handleBatchDelete() {
    if (!onDeleteSamples || selectedIds.size === 0 || isDeletingBatch) return;
    const samplesToDelete = samples.filter((s) => selectedIds.has(s.id));
    setIsDeletingBatch(true);
    try {
      await onDeleteSamples(samplesToDelete);
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } finally {
      setIsDeletingBatch(false);
    }
  }

  async function handleDeleteSample() {
    if (!lightboxSample || !onDeleteSample || isDeletingSample) {
      return;
    }

    setIsDeletingSample(true);

    try {
      await onDeleteSample(lightboxSample);
    } finally {
      setIsDeletingSample(false);
    }
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    sampleIndex: number,
    sampleId: string,
  ) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActiveSample(sampleIndex - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActiveSample(sampleIndex + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveSample(sampleIndex - columnCount);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveSample(sampleIndex + columnCount);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      moveActiveSample(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      moveActiveSample(samples.length - 1);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isSelectMode) {
        handleThumbnailSelect(sampleId, sampleIndex, event.shiftKey);
      } else {
        openLightbox(sampleId);
      }
      return;
    }

    if (event.key === 'Delete' && onDeleteSample) {
      event.preventDefault();
      openLightbox(sampleId);
    }
  }

  if (!samples.length && !loading) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {(onDeleteSamples || actions) && (
        <div className="mb-2 flex min-h-7 items-center justify-between gap-2">
          {isSelectMode ? (
            <>
              <div className="flex items-center gap-3">
                <Button size="xs" variant="subtle" onClick={toggleSelectMode}>
                  {t('common.cancel')}
                </Button>
                <Text c="dimmed" size="xs">
                  {t('project.label.sampleGrid.selected', {
                    params: { count: selectedIds.size },
                  })}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() =>
                    setSelectedIds(new Set(visibleSamples.map((s) => s.id)))
                  }
                >
                  {t('project.label.sampleGrid.selectAll')}
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    color="red"
                    leftSection={<IconTrash size={12} stroke={1.8} />}
                    loading={isDeletingBatch}
                    size="xs"
                    variant="light"
                    onClick={() => void handleBatchDelete()}
                  >
                    {t('project.label.sampleGrid.deleteSelected', {
                      params: { count: selectedIds.size },
                    })}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {onDeleteSamples ? (
                <Button size="xs" variant="subtle" onClick={toggleSelectMode}>
                  {t('project.label.sampleGrid.select')}
                </Button>
              ) : (
                <span />
              )}
              {actions ? (
                <div className="flex items-center gap-1">{actions}</div>
              ) : null}
            </>
          )}
        </div>
      )}
      <ScrollArea.Autosize
        mah={samples.length > 120 ? 450 : undefined}
        offsetScrollbars={samples.length > 120}
        onScrollPositionChange={() => {
          const viewportElement = viewportRef.current;

          if (!viewportElement || !hasMoreSamples) {
            return;
          }

          const remainingDistance =
            viewportElement.scrollHeight -
            viewportElement.scrollTop -
            viewportElement.clientHeight;

          if (remainingDistance <= 240) {
            loadMoreSamples();
          }
        }}
        scrollbarSize={4}
        viewportRef={viewportRef}
      >
        <div
          className="grid gap-3"
          ref={gridRef}
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${minItemSize}px, 1fr))`,
          }}
        >
          {visibleSamples.map((sample, index) => {
            const isActive = sample.id === resolvedActiveSampleId;

            const isSelected = selectedIds.has(sample.id);
            const classIdx =
              classIndexMap && sample.classId !== undefined
                ? classIndexMap[sample.classId]
                : undefined;

            return (
              <button
                aria-label={`Open sample ${index + 1}`}
                aria-pressed={isSelectMode ? isSelected : isActive}
                className={clsx(
                  'relative aspect-square overflow-hidden rounded-md border bg-zinc-50 transition',
                  newSampleIds.has(sample.id) && 'motion-preset-pop motion-duration-300',
                  isSelectMode && isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900'
                    : isActive && !isSelectMode
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900'
                      : 'border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950',
                )}
                key={sample.id}
                onClick={(e) => {
                  if (isSelectMode) {
                    handleThumbnailSelect(sample.id, index, e.shiftKey);
                    return;
                  }
                  openLightbox(sample.id);
                }}
                onFocus={() => {
                  setResolvedActiveSampleId(sample.id);
                }}
                onKeyDown={(event) => {
                  handleThumbnailKeyDown(event, index, sample.id);
                }}
                ref={(node) => {
                  thumbnailRefMap.current[sample.id] = node;
                }}
                tabIndex={
                  isActive || (resolvedActiveSampleId == null && index === 0)
                    ? 0
                    : -1
                }
                type="button"
              >
                {previewMap[sample.id] ? (
                  <img
                    alt={
                      sample.originalFileName ?? sample.className ?? 'Sample'
                    }
                    className="size-full object-cover"
                    decoding="async"
                    loading="lazy"
                    src={previewMap[sample.id]}
                  />
                ) : (
                  <Skeleton className="size-full" radius={0} animate />
                )}

                {isSelectMode && (
                  <div
                    className={clsx(
                      'absolute top-1 left-1 flex size-4 items-center justify-center rounded border-2',
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-zinc-300 bg-white/80 dark:border-zinc-500 dark:bg-zinc-900/80',
                    )}
                  >
                    {isSelected && (
                      <svg
                        viewBox="0 0 10 10"
                        className="size-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M1.5 5l2.5 2.5 4.5-4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                )}

                {classIdx !== undefined && (
                  <Badge
                    color={classColorMap?.[sample.classId] ?? colorFromString(sample.classId)}
                    radius="xs"
                    size="xs"
                    className="absolute bottom-1 left-1 flex"
                  >
                    {classIdx + 1}
                  </Badge>
                )}
              </button>
            );
          })}

          {loading ? (
            <SampleGridSkeleton
              columnCount={columnCount}
              isLoadingPreviews={isLoadingPreviews}
            />
          ) : null}
        </div>
        {hasMoreSamples ? (
          <div className="flex items-center justify-between gap-3 px-1 py-4">
            <Text c="dimmed" size="sm">
              {t('project.label.sampleGrid.showing', {
                params: {
                  visible: visibleSamples.length,
                  total: samples.length,
                },
              })}
            </Text>
            <Button onClick={loadMoreSamples} size="xs" variant="light">
              {t('project.label.sampleGrid.loadMore', {
                params: {
                  count: Math.min(
                    SAMPLE_PAGE_SIZE,
                    samples.length - visibleSamples.length,
                  ),
                },
              })}
            </Button>
          </div>
        ) : null}
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
                    {lightboxSample.originalFileName ??
                      lightboxSample.className ??
                      'Sample'}
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
                    moveLightbox(-1);
                  }}
                  variant="default"
                >
                  <IconChevronLeft size={18} stroke={1.8} />
                </ActionIcon>
                <ActionIcon
                  aria-label="Next sample"
                  disabled={lightboxSampleIndex >= samples.length - 1}
                  onClick={() => {
                    moveLightbox(1);
                  }}
                  variant="default"
                >
                  <IconChevronRight size={18} stroke={1.8} />
                </ActionIcon>
              </div>
            </div>

            <div
              className={clsx(
                'max-h-[75vh] min-h-60 min-w-[min(70vw,960px)]',
                'flex items-center justify-center overflow-hidden rounded-lg',
                'ring-1 ring-zinc-300 dark:ring-zinc-700',
                'bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#eef2f7)] bg-[size:20px_20px,20px_20px,100%_100%] dark:border-zinc-800 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(135deg,#09090b,#111827)] dark:bg-[size:20px_20px,20px_20px,100%_100%]',
              )}
            >
              {previewMap[lightboxSample.id] ? (
                <img
                  alt={
                    lightboxSample.originalFileName ??
                    lightboxSample.className ??
                    'Sample'
                  }
                  className="max-h-[75vh] max-w-full object-contain"
                  src={previewMap[lightboxSample.id]}
                />
              ) : (
                <Skeleton className="size-full" radius="md" animate />
              )}
            </div>

            {showMetadata ? (
              <Table
                className="text-xs"
                highlightOnHover={false}
                horizontalSpacing="sm"
                verticalSpacing={2}
              >
                <Table.Tbody>
                  <MetadataRow
                    label="Name"
                    value={lightboxSample.originalFileName ?? '-'}
                  />
                  <MetadataRow
                    label="Path"
                    value={
                      lightboxSample.originalFilePath ?? lightboxSample.fileName
                    }
                  />
                  <MetadataRow
                    label="Mime"
                    value={lightboxSample.mimeType ?? '-'}
                  />
                  <MetadataRow
                    label="Size"
                    value={
                      lightboxSample.fileSize != null
                        ? `${lightboxSample.fileSize.toLocaleString()} B`
                        : '-'
                    }
                  />
                  <MetadataRow
                    label="Dimensions"
                    value={
                      lightboxSample.width && lightboxSample.height
                        ? `${lightboxSample.width} x ${lightboxSample.height}`
                        : '-'
                    }
                  />
                  <MetadataRow
                    label="Modified"
                    value={lightboxSample.lastModifiedAt ?? '-'}
                  />
                  <MetadataRow
                    label="Hash"
                    value={lightboxSample.contentHash ?? '-'}
                  />
                  <MetadataRow label="Source" value={lightboxSample.source} />
                </Table.Tbody>
              </Table>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={() => {
                  setShowMetadata((current) => !current);
                  setIsDeleteConfirmOpen(false);
                }}
                variant="default"
              >
                {showMetadata
                  ? t('project.label.sampleGrid.hideMeta')
                  : t('project.label.sampleGrid.showMeta')}
              </Button>
              <div className="flex items-center gap-2">
                <Button onClick={closeLightbox} variant="default">
                  {t('common.close')}
                </Button>
                {onDeleteSample ? (
                  <Popover
                    onDismiss={() => {
                      setIsDeleteConfirmOpen(false);
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
                          setIsDeleteConfirmOpen((current) => !current);
                        }}
                        variant="light"
                      >
                        {t('common.delete')}
                      </Button>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <div className="w-56 space-y-3">
                        <Text size="sm">
                          {t('project.label.sampleGrid.deleteConfirm')}
                        </Text>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => {
                              setIsDeleteConfirmOpen(false);
                            }}
                            size="xs"
                            variant="default"
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            color="red"
                            data-autofocus
                            loading={isDeletingSample}
                            onClick={() => {
                              void handleDeleteSample().finally(() => {
                                setIsDeleteConfirmOpen(false);
                              });
                            }}
                            size="xs"
                          >
                            {t('project.label.sampleGrid.confirm')}
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
  );
};

function SampleGridSkeleton({
  columnCount,
  isLoadingPreviews,
}: {
  columnCount: number;
  isLoadingPreviews: boolean;
}) {
  const skeletonCount = Math.max(columnCount * 3, 12);

  return Array.from({ length: skeletonCount }, (_, index) => (
    <div
      className="aspect-square overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      key={`sample-skeleton-${index}`}
    >
      <Skeleton animate={isLoadingPreviews} className="size-full" radius="md" />
    </div>
  ));
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <Table.Tr>
      <Table.Td className="w-28 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
        {label}
      </Table.Td>
      <Table.Td className="break-all text-zinc-900 dark:text-zinc-100">
        {value}
      </Table.Td>
    </Table.Tr>
  );
}

export default SampleGrid;
