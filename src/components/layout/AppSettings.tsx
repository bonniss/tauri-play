import { Button, Modal } from "@mantine/core"
import { FunctionComponent } from "react"
import { useAppProvider } from "./AppProvider"
import AppInfo from "./settings/AppInfo"

interface AppSettingsProps {}

const AppSettings: FunctionComponent<AppSettingsProps> = () => {
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
          <AppInfo />
      </Modal>
    </>
  )
}

export default AppSettings
