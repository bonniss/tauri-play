import { type } from 'arktype';

const classSettingsSchema = type({
  'classColor?': 'string',
});

export type ClassSettings = typeof classSettingsSchema.infer;

export const DEFAULT_CLASS_SETTINGS: ClassSettings = classSettingsSchema.assert({});

export function parseClassSettings(value: string | null | undefined): ClassSettings {
  try {
    const parsed = classSettingsSchema(JSON.parse(value ?? '{}'));
    if (parsed instanceof type.errors) return DEFAULT_CLASS_SETTINGS;
    return parsed;
  } catch {
    return DEFAULT_CLASS_SETTINGS;
  }
}

export function stringifyClassSettings(value: ClassSettings): string {
  return JSON.stringify(value);
}
