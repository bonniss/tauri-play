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
