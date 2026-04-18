import { type } from "arktype"

export interface ProjectLabelSettings {
  maxClasses: number | null
  maxSamplesPerClass: number | null
  minClasses: number
  minSamplesPerClass: number
}

export interface ProjectTrainSettings {
  batchSize: number
  earlyStopping: boolean
  earlyStoppingPatience: number
  epochs: number
  imageSize: number
  learningRate: number
  validationSplit: number
}

export interface ProjectPlaySettings {
  autoPredictOnUpload: boolean
  confidenceThreshold: number
  liveAspectRatio: "16:9" | "4:3" | "1:1"
  livePredictInterval: number
  mode: "upload" | "camera"
  showAllClasses: boolean
  showConfidenceScores: boolean
  topK: number
}

export interface ProjectSettings {
  favorite: boolean
  icon: string
  label: ProjectLabelSettings
  play: ProjectPlaySettings
  train: ProjectTrainSettings
}

export interface ProjectLabelSettingsFormValues {
  maxClasses: string
  maxSamplesPerClass: string
  minClasses: string
  minSamplesPerClass: string
}

export interface ProjectTrainSettingsFormValues {
  batchSize: string
  earlyStopping: boolean
  earlyStoppingPatience: string
  epochs: string
  imageSize: string
  learningRate: string
  validationSplit: string
}

export interface ProjectPlaySettingsFormValues {
  autoPredictOnUpload: boolean
  confidenceThreshold: string
  liveAspectRatio: "16:9" | "4:3" | "1:1"
  livePredictInterval: string
  mode: "upload" | "camera"
  showAllClasses: boolean
  showConfidenceScores: boolean
  topK: string
}

export const DEFAULT_PROJECT_LABEL_SETTINGS: ProjectLabelSettings = {
  maxClasses: null,
  maxSamplesPerClass: null,
  minClasses: 2,
  minSamplesPerClass: 10,
}

export const DEFAULT_PROJECT_TRAIN_SETTINGS: ProjectTrainSettings = {
  batchSize: 16,
  earlyStopping: true,
  earlyStoppingPatience: 3,
  epochs: 20,
  imageSize: 224,
  learningRate: 0.001,
  validationSplit: 0.2,
}

export const DEFAULT_PROJECT_PLAY_SETTINGS: ProjectPlaySettings = {
  autoPredictOnUpload: true,
  confidenceThreshold: 0,
  liveAspectRatio: "16:9",
  livePredictInterval: 700,
  mode: "upload",
  showAllClasses: true,
  showConfidenceScores: true,
  topK: 3,
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  favorite: false,
  icon: "🦊",
  label: DEFAULT_PROJECT_LABEL_SETTINGS,
  play: DEFAULT_PROJECT_PLAY_SETTINGS,
  train: DEFAULT_PROJECT_TRAIN_SETTINGS,
}

const labelSettingsInputSchema = type({
  maxClasses: "number.integer >= 2 | null | undefined",
  maxSamplesPerClass: "number.integer >= 10 | null | undefined",
  minClasses: "number.integer >= 2 | undefined",
  minSamplesPerClass: "number.integer >= 10 | undefined",
})

const trainSettingsInputSchema = type({
  batchSize: "number.integer >= 1 | undefined",
  earlyStopping: "boolean | undefined",
  earlyStoppingPatience: "number.integer >= 1 | undefined",
  epochs: "number.integer >= 1 | undefined",
  imageSize: "number.integer >= 32 | undefined",
  learningRate: "number > 0 | undefined",
  validationSplit: "number > 0 | undefined",
})

const playSettingsInputSchema = type({
  autoPredictOnUpload: "boolean | undefined",
  confidenceThreshold: "number >= 0 | undefined",
  liveAspectRatio: "'16:9' | '4:3' | '1:1' | undefined",
  livePredictInterval: "number > 0 | undefined",
  mode: "'upload' | 'camera' | undefined",
  showAllClasses: "boolean | undefined",
  showConfidenceScores: "boolean | undefined",
  topK: "number.integer >= 1 | undefined",
})

const projectSettingsInputSchema = type({
  favorite: "boolean | undefined",
  icon: "string | undefined",
  label: labelSettingsInputSchema.or("undefined"),
  play: playSettingsInputSchema.or("undefined"),
  train: trainSettingsInputSchema.or("undefined"),
})

type ProjectLabelSettingsInput = typeof labelSettingsInputSchema.infer
type ProjectPlaySettingsInput = typeof playSettingsInputSchema.infer
type ProjectTrainSettingsInput = typeof trainSettingsInputSchema.infer
type ProjectSettingsInput = typeof projectSettingsInputSchema.infer

function normalizeMaxSetting(value: number | null | undefined, minValue: number) {
  if (value == null) {
    return null
  }

  return Math.max(minValue, value)
}

export function normalizeProjectLabelSettings(
  value: ProjectLabelSettingsInput | undefined,
): ProjectLabelSettings {
  const source = value ?? {
    maxClasses: undefined,
    maxSamplesPerClass: undefined,
    minClasses: undefined,
    minSamplesPerClass: undefined,
  }
  const minClasses =
    source.minClasses ?? DEFAULT_PROJECT_LABEL_SETTINGS.minClasses
  const minSamplesPerClass =
    source.minSamplesPerClass ?? DEFAULT_PROJECT_LABEL_SETTINGS.minSamplesPerClass

  return {
    minClasses,
    maxClasses: normalizeMaxSetting(source.maxClasses, minClasses),
    minSamplesPerClass,
    maxSamplesPerClass: normalizeMaxSetting(
      source.maxSamplesPerClass,
      minSamplesPerClass,
    ),
  }
}

export function normalizeProjectSettings(
  value: ProjectSettingsInput | undefined,
): ProjectSettings {
  const source = value ?? {
    favorite: undefined,
    icon: undefined,
    label: undefined,
    play: undefined,
    train: undefined,
  }

  return {
    favorite: source.favorite ?? DEFAULT_PROJECT_SETTINGS.favorite,
    icon: source.icon?.trim() || DEFAULT_PROJECT_SETTINGS.icon,
    label: normalizeProjectLabelSettings(source.label),
    play: normalizeProjectPlaySettings(source.play),
    train: normalizeProjectTrainSettings(source.train),
  }
}

export function normalizeProjectPlaySettings(
  value: ProjectPlaySettingsInput | undefined,
): ProjectPlaySettings {
  const source = value ?? {
    autoPredictOnUpload: undefined,
    confidenceThreshold: undefined,
    liveAspectRatio: undefined,
    livePredictInterval: undefined,
    mode: undefined,
    showAllClasses: undefined,
    showConfidenceScores: undefined,
    topK: undefined,
  }

  return {
    autoPredictOnUpload:
      source.autoPredictOnUpload ??
      DEFAULT_PROJECT_PLAY_SETTINGS.autoPredictOnUpload,
    confidenceThreshold:
      source.confidenceThreshold ??
      DEFAULT_PROJECT_PLAY_SETTINGS.confidenceThreshold,
    liveAspectRatio:
      source.liveAspectRatio ?? DEFAULT_PROJECT_PLAY_SETTINGS.liveAspectRatio,
    livePredictInterval:
      source.livePredictInterval ?? DEFAULT_PROJECT_PLAY_SETTINGS.livePredictInterval,
    mode: source.mode ?? DEFAULT_PROJECT_PLAY_SETTINGS.mode,
    showAllClasses:
      source.showAllClasses ?? DEFAULT_PROJECT_PLAY_SETTINGS.showAllClasses,
    showConfidenceScores:
      source.showConfidenceScores ??
      DEFAULT_PROJECT_PLAY_SETTINGS.showConfidenceScores,
    topK: source.topK ?? DEFAULT_PROJECT_PLAY_SETTINGS.topK,
  }
}

export function normalizeProjectTrainSettings(
  value: ProjectTrainSettingsInput | undefined,
): ProjectTrainSettings {
  const source = value ?? {
    batchSize: undefined,
    earlyStopping: undefined,
    earlyStoppingPatience: undefined,
    epochs: undefined,
    imageSize: undefined,
    learningRate: undefined,
    validationSplit: undefined,
  }

  return {
    batchSize: source.batchSize ?? DEFAULT_PROJECT_TRAIN_SETTINGS.batchSize,
    earlyStopping:
      source.earlyStopping ?? DEFAULT_PROJECT_TRAIN_SETTINGS.earlyStopping,
    earlyStoppingPatience:
      source.earlyStoppingPatience ??
      DEFAULT_PROJECT_TRAIN_SETTINGS.earlyStoppingPatience,
    epochs: source.epochs ?? DEFAULT_PROJECT_TRAIN_SETTINGS.epochs,
    imageSize: source.imageSize ?? DEFAULT_PROJECT_TRAIN_SETTINGS.imageSize,
    learningRate:
      source.learningRate ?? DEFAULT_PROJECT_TRAIN_SETTINGS.learningRate,
    validationSplit: Math.min(
      0.5,
      source.validationSplit ?? DEFAULT_PROJECT_TRAIN_SETTINGS.validationSplit,
    ),
  }
}

export function parseProjectSettings(settings: string | null | undefined) {
  if (!settings) {
    return DEFAULT_PROJECT_SETTINGS
  }

  try {
    const parsedSettings = projectSettingsInputSchema(JSON.parse(settings))

    if (parsedSettings instanceof type.errors) {
      return DEFAULT_PROJECT_SETTINGS
    }

    return normalizeProjectSettings(parsedSettings)
  } catch {
    return DEFAULT_PROJECT_SETTINGS
  }
}

export function stringifyProjectSettings(settings: ProjectSettings) {
  return JSON.stringify(settings)
}

export function projectLabelSettingsToFormValues(
  settings: ProjectLabelSettings,
): ProjectLabelSettingsFormValues {
  return {
    maxClasses: settings.maxClasses != null ? String(settings.maxClasses) : "",
    maxSamplesPerClass:
      settings.maxSamplesPerClass != null
        ? String(settings.maxSamplesPerClass)
        : "",
    minClasses: String(settings.minClasses),
    minSamplesPerClass: String(settings.minSamplesPerClass),
  }
}

export function parseProjectLabelSettingsFormValues(
  values: ProjectLabelSettingsFormValues,
): ProjectLabelSettings {
  const nextMinClasses = Number(values.minClasses.trim())
  const nextMinSamplesPerClass = Number(values.minSamplesPerClass.trim())
  const nextMaxClasses = values.maxClasses.trim()
    ? Number(values.maxClasses.trim())
    : null
  const nextMaxSamplesPerClass = values.maxSamplesPerClass.trim()
    ? Number(values.maxSamplesPerClass.trim())
    : null

  return normalizeProjectLabelSettings({
    maxClasses: Number.isFinite(nextMaxClasses) ? nextMaxClasses : null,
    maxSamplesPerClass: Number.isFinite(nextMaxSamplesPerClass)
      ? nextMaxSamplesPerClass
      : null,
    minClasses: Number.isFinite(nextMinClasses) ? nextMinClasses : undefined,
    minSamplesPerClass: Number.isFinite(nextMinSamplesPerClass)
      ? nextMinSamplesPerClass
      : undefined,
  })
}

export function projectTrainSettingsToFormValues(
  settings: ProjectTrainSettings,
): ProjectTrainSettingsFormValues {
  return {
    batchSize: String(settings.batchSize),
    earlyStopping: settings.earlyStopping,
    earlyStoppingPatience: String(settings.earlyStoppingPatience),
    epochs: String(settings.epochs),
    imageSize: String(settings.imageSize),
    learningRate: String(settings.learningRate),
    validationSplit: String(settings.validationSplit),
  }
}

export function parseProjectTrainSettingsFormValues(
  values: ProjectTrainSettingsFormValues,
): ProjectTrainSettings {
  const nextBatchSize = Number(values.batchSize.trim())
  const nextEarlyStoppingPatience = Number(values.earlyStoppingPatience.trim())
  const nextEpochs = Number(values.epochs.trim())
  const nextImageSize = Number(values.imageSize.trim())
  const nextLearningRate = Number(values.learningRate.trim())
  const nextValidationSplit = Number(values.validationSplit.trim())

  return normalizeProjectTrainSettings({
    batchSize: Number.isFinite(nextBatchSize) ? nextBatchSize : undefined,
    earlyStopping: values.earlyStopping,
    earlyStoppingPatience: Number.isFinite(nextEarlyStoppingPatience)
      ? nextEarlyStoppingPatience
      : undefined,
    epochs: Number.isFinite(nextEpochs) ? nextEpochs : undefined,
    imageSize: Number.isFinite(nextImageSize) ? nextImageSize : undefined,
    learningRate: Number.isFinite(nextLearningRate)
      ? nextLearningRate
      : undefined,
    validationSplit: Number.isFinite(nextValidationSplit)
      ? nextValidationSplit
      : undefined,
  })
}

export function projectPlaySettingsToFormValues(
  settings: ProjectPlaySettings,
): ProjectPlaySettingsFormValues {
  return {
    autoPredictOnUpload: settings.autoPredictOnUpload,
    confidenceThreshold: String(settings.confidenceThreshold),
    liveAspectRatio: settings.liveAspectRatio,
    livePredictInterval: String(settings.livePredictInterval),
    mode: settings.mode,
    showAllClasses: settings.showAllClasses,
    showConfidenceScores: settings.showConfidenceScores,
    topK: String(settings.topK),
  }
}

export function parseProjectPlaySettingsFormValues(
  values: ProjectPlaySettingsFormValues,
): ProjectPlaySettings {
  const nextConfidenceThreshold = Number(values.confidenceThreshold.trim())
  const nextTopK = Number(values.topK.trim())
  const nextLivePredictInterval = Number(values.livePredictInterval.trim())

  return normalizeProjectPlaySettings({
    autoPredictOnUpload: values.autoPredictOnUpload,
    confidenceThreshold: Number.isFinite(nextConfidenceThreshold)
      ? nextConfidenceThreshold
      : undefined,
    liveAspectRatio: values.liveAspectRatio,
    livePredictInterval: Number.isFinite(nextLivePredictInterval) && nextLivePredictInterval > 0
      ? nextLivePredictInterval
      : undefined,
    mode: values.mode,
    showAllClasses: values.showAllClasses,
    showConfidenceScores: values.showConfidenceScores,
    topK: Number.isFinite(nextTopK) ? nextTopK : undefined,
  })
}
