import { Button, Group, Modal, Radio, Text } from "@mantine/core"
import { FunctionComponent } from "react"
import { setLocale, t, useLocale } from "~/lib/i18n"
import { useAppProvider } from "./AppProvider"
import AppInfo from "./settings/AppInfo"

interface AppSettingsProps {}

const AppSettings: FunctionComponent<AppSettingsProps> = () => {
  const locale = useLocale()
  const { appSettingsOpened, toggleAppSettings, closeAppSettings } =
    useAppProvider()

  return (
    <>
      <Button onClick={toggleAppSettings} size="compact-sm" variant="subtle">
        Settings
      </Button>
      <Modal
        onClose={closeAppSettings}
        opened={appSettingsOpened}
        title={null}
        withCloseButton={false}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <Text fw={600} size="sm">
              {t("settings.language")}
            </Text>
            <Radio.Group onChange={setLocale} value={locale}>
              <div className="flex gap-4">
                {[
                  { flag: '/flags/us.svg', label: "English", value: "en" },
                  { flag: '/flags/vn.svg', label: "Tiếng Việt", value: "vi" },
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
                      <Radio.Indicator
                        size="xs"
                        checked={locale === item.value}
                      />
                    </Group>
                  </Radio.Card>
                ))}
              </div>
            </Radio.Group>
          </div>
          <AppInfo />
        </div>
      </Modal>
    </>
  )
}

export default AppSettings
