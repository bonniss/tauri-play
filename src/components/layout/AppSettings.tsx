import { ActionIcon, Modal } from "@mantine/core"
import { IconSettings } from "@tabler/icons-react"
import { FunctionComponent } from "react"
import { useAppProvider } from "./AppProvider"
import AppInfo from "./settings/AppInfo"

interface AppSettingsProps {}

const AppSettings: FunctionComponent<AppSettingsProps> = () => {
  const { appSettingsOpened, toggleAppSettings, closeAppSettings } =
    useAppProvider()

  return (
    <>
      <ActionIcon variant="light" onClick={toggleAppSettings}>
        <IconSettings className="size-5 motion-rotate-loop-180 motion-duration-[5s]" />
      </ActionIcon>
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
