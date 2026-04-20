import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Radio,
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

          <div className="space-y-3">
            <Text fw={600} size="sm">{t('settings.language')}</Text>
            <Radio.Group onChange={setLocale} value={locale}>
              <div className="flex gap-4">
                {[
                  { flag: '/flags/us.svg', label: 'English', value: 'en' },
                  { flag: '/flags/vn.svg', label: 'Tiếng Việt', value: 'vi' },
                ].map((item) => (
                  <Radio.Card
                    checked={locale === item.value}
                    key={item.value}
                    p="xs"
                    value={item.value}
                  >
                    <Group align="center" justify="space-between" wrap="nowrap">
                      <Group align="center" gap="sm" wrap="nowrap">
                        <img
                          alt={item.label}
                          className="h-6 w-6 rounded-xl"
                          src={item.flag}
                        />
                        <span className="text-sm">{item.label}</span>
                      </Group>
                      <Radio.Indicator size="xs" checked={locale === item.value} />
                    </Group>
                  </Radio.Card>
                ))}
              </div>
            </Radio.Group>
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
