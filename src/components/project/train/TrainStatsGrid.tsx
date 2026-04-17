import { Text } from "@mantine/core"
import { useDataTrain } from "~/components/project/train/DataTrainProvider"
import { t, useLocale } from "~/lib/i18n"

function TrainStatsGrid() {
  useLocale()
  const {
    hasTrainData,
    inspectedDataSnapshot,
    openTrainDataDrawer,
    openValidationDataDrawer,
    validationSplitLabel,
  } = useDataTrain()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {t("project.train.dataset.validationSplit")}
        </span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {validationSplitLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DatasetButton
          color="blue"
          count={inspectedDataSnapshot.trainSamples}
          disabled={!hasTrainData}
          label={t("project.train.dataset.trainImages")}
          onClick={openTrainDataDrawer}
        />
        <DatasetButton
          color="violet"
          count={inspectedDataSnapshot.validationSamples}
          disabled={!hasTrainData}
          label={t("project.train.dataset.validation")}
          onClick={openValidationDataDrawer}
        />
      </div>
    </div>
  )
}

function DatasetButton({
  color,
  count,
  disabled,
  label,
  onClick,
}: {
  color: "blue" | "violet"
  count: number
  disabled: boolean
  label: string
  onClick: () => void
}) {
  const styles = {
    blue: {
      card: "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:hover:bg-blue-950/50",
      number: "text-blue-600 dark:text-blue-400",
    },
    violet: {
      card: "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100 dark:border-violet-900/50 dark:bg-violet-950/30 dark:hover:bg-violet-950/50",
      number: "text-violet-600 dark:text-violet-400",
    },
  }[color]

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-4 py-4 text-left transition-colors disabled:pointer-events-none disabled:opacity-40 ${styles.card}`}
    >
      <Text c="dimmed" size="xs" tt="uppercase">
        {label}
      </Text>
      <div className={`mt-1 text-4xl font-semibold tracking-tight ${styles.number}`}>
        {count}
      </div>
    </button>
  )
}

export default TrainStatsGrid
