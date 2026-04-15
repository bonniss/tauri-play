import { type } from "arktype"

export interface ProjectLabelSettings {
  maxClasses: number | null
  maxSamplesPerClass: number | null
  minClasses: number
  minSamplesPerClass: number
}

export interface ProjectTrainSettings {}

export interface ProjectPlaySettings {}

export interface ProjectSettings {
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

export const DEFAULT_PROJECT_LABEL_SETTINGS: ProjectLabelSettings = {
  maxClasses: null,
  maxSamplesPerClass: null,
  minClasses: 2,
  minSamplesPerClass: 10,
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  label: DEFAULT_PROJECT_LABEL_SETTINGS,
  play: {},
  train: {},
}

const labelSettingsInputSchema = type({
  maxClasses: "number.integer >= 2 | null | undefined",
  maxSamplesPerClass: "number.integer >= 10 | null | undefined",
  minClasses: "number.integer >= 2 | undefined",
  minSamplesPerClass: "number.integer >= 10 | undefined",
})

const projectSettingsInputSchema = type({
  label: labelSettingsInputSchema.or("undefined"),
  play: "object | undefined",
  train: "object | undefined",
})

type ProjectLabelSettingsInput = typeof labelSettingsInputSchema.infer
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
    label: undefined,
    play: undefined,
    train: undefined,
  }

  return {
    label: normalizeProjectLabelSettings(source.label),
    play: {},
    train: {},
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
