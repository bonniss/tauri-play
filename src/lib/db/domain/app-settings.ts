import { type } from 'arktype';
import { getKysely } from '../kysely';

const DEFAULT_SAMPLE_PATH_PATTERN =
  'projects/{projectId}/samples/{classId}/{fileName}';

const REQUIRED_PLACEHOLDERS = ['{projectId}', '{classId}', '{fileName}'] as const;

export function validateSamplePathPattern(value: string): string | null {
  for (const p of REQUIRED_PLACEHOLDERS) {
    if (!value.includes(p)) return `Missing placeholder ${p}`;
  }
  return null;
}

const appSettingsSchema = type({
  samplePathPattern: type('string > 0').default(DEFAULT_SAMPLE_PATH_PATTERN),
});

export type AppSettingValues = typeof appSettingsSchema.infer;
export type AppSettingKey = keyof AppSettingValues;

export const DEFAULT_APP_SETTINGS: AppSettingValues = appSettingsSchema.assert({});

export async function getAppSettings(): Promise<AppSettingValues> {
  const db = getKysely();
  const rows = await db
    .selectFrom('app_settings')
    .select(['key', 'value'])
    .execute();

  const raw: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      raw[row.key] = JSON.parse(row.value);
    } catch {
      // skip malformed rows, schema defaults will fill in
    }
  }

  const result = appSettingsSchema(raw);
  if (result instanceof type.errors) {
    return DEFAULT_APP_SETTINGS;
  }
  return result;
}

export async function setAppSetting<K extends AppSettingKey>(
  key: K,
  value: AppSettingValues[K],
): Promise<void> {
  const db = getKysely();
  const serialized = JSON.stringify(value);
  const now = new Date().toISOString();

  await db
    .insertInto('app_settings')
    .values({ key, value: serialized, updated_at: now })
    .onConflict((oc) =>
      oc.column('key').doUpdateSet({ value: serialized, updated_at: now }),
    )
    .execute();
}
