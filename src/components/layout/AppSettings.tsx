import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconChevronRight, IconRefresh } from '@tabler/icons-react';
import { FunctionComponent, useEffect, useState } from 'react';
import {
  DEFAULT_APP_SETTINGS,
  validateSamplePathPattern,
} from '~/lib/db/domain/app-settings';
import ColorSchemer from './settings/ColorSchemer';
import { useAppProvider } from './AppProvider';
import AppInfo from './settings/AppInfo';

interface AppSettingsProps {}

const AppSettings: FunctionComponent<AppSettingsProps> = () => {
  const {
    t,
    locale,
    setLocale,
    appSettings,
    updateAppSetting,
    appSettingsOpened,
    toggleAppSettings,
    closeAppSettings,
  } = useAppProvider();

  const [patternDraft, setPatternDraft] = useState(appSettings.samplePathPattern);
  const patternError = validateSamplePathPattern(patternDraft);
  const patternChanged = patternDraft !== appSettings.samplePathPattern;

  useEffect(() => {
    setPatternDraft(appSettings.samplePathPattern);
  }, [appSettings.samplePathPattern]);

  async function savePattern() {
    if (patternError) return;
    await updateAppSetting({ key: 'samplePathPattern', value: patternDraft });
  }

  return (
    <>
      <Button onClick={toggleAppSettings} size="compact-sm" variant="subtle">
        {t('common.settings')}
      </Button>
      <Modal
        onClose={closeAppSettings}
        opened={appSettingsOpened}
        title={null}
        withCloseButton={false}
      >
        <div className="space-y-6">

          <div className="flex items-center justify-between gap-4">
            <Text fw={600} size="sm">{t('settings.theme')}</Text>
            <ColorSchemer size="sm" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <Text fw={600} size="sm">{t('settings.language')}</Text>
            <Select
              data={[
                { value: 'vi', label: 'Tiếng Việt' },
                { value: 'en', label: 'English' },
                { value: 'ru', label: 'Русский' },
              ]}
              onChange={(v) => v && setLocale(v)}
              value={locale}
              renderOption={({ option }) => {
                const flag: Record<string, string> = { en: '/flags/us.svg', vi: '/flags/vn.svg', ru: '/flags/ru.svg' };
                return (
                  <Group gap="xs" wrap="nowrap">
                    <img alt={option.label} className="h-4 w-4 rounded-sm" src={flag[option.value]} />
                    <span>{option.label}</span>
                  </Group>
                );
              }}
              leftSection={
                <img
                  alt={locale}
                  className="h-4 w-4 rounded-sm"
                  src={{ en: '/flags/us.svg', vi: '/flags/vn.svg', ru: '/flags/ru.svg' }[locale]}
                />
              }
              allowDeselect={false}
              w={160}
            />
          </div>

          <SettingsSude label={t('settings.system')}>
            <TextInput
              description={t('settings.samplePathPatternDescription')}
              error={patternError}
              label={t('settings.samplePathPattern')}
              onBlur={savePattern}
              onChange={(e) => setPatternDraft(e.currentTarget.value)}
              rightSection={
                patternDraft !== DEFAULT_APP_SETTINGS.samplePathPattern ? (
                  <Tooltip label={t('common.reset')}>
                    <ActionIcon
                      color="gray"
                      onClick={() => {
                        const def = DEFAULT_APP_SETTINGS.samplePathPattern;
                        setPatternDraft(def);
                        void updateAppSetting({ key: 'samplePathPattern', value: def });
                      }}
                      size="sm"
                      variant="subtle"
                    >
                      <IconRefresh className="size-3.5" />
                    </ActionIcon>
                  </Tooltip>
                ) : null
              }
              value={patternDraft}
            />
            {patternChanged && !patternError && (
              <Button className="mt-2" onClick={savePattern} size="xs" variant="light">
                {t('common.save')}
              </Button>
            )}
          </SettingsSude>

          <SettingsSude label={t('settings.appInfo')}>
            <AppInfo />
          </SettingsSude>

        </div>
      </Modal>
    </>
  );
};

function SettingsSude({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 select-none">
        <Text fw={600} size="sm">{label}</Text>
        <IconChevronRight className="size-4 text-zinc-400 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export default AppSettings;
