import { Button, Loader, Table, Text } from "@mantine/core"
import { IconFolderOpen } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import {
  getIdentifier,
  getName,
  getTauriVersion,
  getVersion,
} from "@tauri-apps/api/app"
import {
  appCacheDir,
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  appLogDir,
} from "@tauri-apps/api/path"
import { openPath } from "@tauri-apps/plugin-opener"
import {
  arch,
  family,
  locale,
  type as osType,
  version as osVersion,
  platform,
} from "@tauri-apps/plugin-os"
import { isDev } from "~/lib/env"
import ColorSchemer from "./ColorSchemer"

const { Tr, Td, Th, Tbody } = Table

async function getAppInfo() {
  const [
    dataPath,
    appName,
    appVersion,
    identifier,
    systemArch,
    systemFamily,
    systemLocale,
    systemPlatform,
    systemType,
    systemVersion,

    // development only
    tauriVersion,
    localDataDir,
    cacheDir,
    logDir,
    configDir,
  ] = await Promise.all([
    appDataDir(),
    getName(),
    getVersion(),
    getIdentifier(),
    arch(),
    family(),
    locale(),
    platform(),
    osType(),
    osVersion(),

    // development only
    getTauriVersion(),
    appLocalDataDir(),
    appCacheDir(),
    appLogDir(),
    appConfigDir(),
  ])

  return {
    appName,
    appVersion,
    dataPath,
    identifier,
    systemArch,
    systemLocale: systemLocale ?? "Unknown",
    systemPlatform,
    systemType: systemType || systemFamily,
    systemVersion: systemVersion || "Unknown",

    // development only
    tauriVersion,
    localDataDir,
    cacheDir,
    logDir,
    configDir,
  }
}

const AppInfo = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["app-info"],
    queryFn: getAppInfo,
    staleTime: Infinity,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader size="sm" />
        <Text c="dimmed" size="sm">
          Loading app info...
        </Text>
      </div>
    )
  }

  if (error) {
    return (
      <Text c="red" size="sm">
        {error instanceof Error ? error.message : "Failed to load app info."}
      </Text>
    )
  }

  if (!data) {
    return null
  }

  const rows = [
    { label: "App", value: data.appName },
    { label: "Version", value: data.appVersion },
    { label: "Identifier", value: data.identifier },
    { label: "Platform", value: data.systemPlatform },
    { label: "OS", value: `${data.systemType} ${data.systemVersion}`.trim() },
    { label: "Arch", value: data.systemArch },
    { label: "Locale", value: data.systemLocale },
  ].map((row) => (
    <Tr key={row.label}>
      <Th className="w-32">
        <Text c="dimmed" fw={500} size="sm">
          {row.label}
        </Text>
      </Th>
      <Td className="font-mono">{row.value}</Td>
    </Tr>
  ))

  let devRows = isDev ? (
    <>
      <Tr>
        <Th className="w-32">
          <Text c="dimmed" fw={500} size="sm">
            Tauri
          </Text>
        </Th>
        <Td className="font-mono">{data.tauriVersion}</Td>
      </Tr>

      {[
        { label: "LOCAL_DATA_DIR", value: data.localDataDir },
        { label: "CACHE_DIR", value: data.cacheDir },
        { label: "LOG_DIR", value: data.logDir },
        { label: "CONFIG_DIR", value: data.configDir },
      ].map((row) => (
        <Tr key={row.label}>
          <Th className="w-32 align-middle">
            <Text c="dimmed" fw={500} size="sm">
              {row.label}
            </Text>
          </Th>
          <Td className="font-mono align-middle">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconFolderOpen className="size-4" />}
              onClick={() => {
                void openPath(row.value)
              }}
            >
              Open
            </Button>
          </Td>
        </Tr>
      ))}
    </>
  ) : (
    []
  )

  return (
    <Table withRowBorders layout="fixed">
      <Tbody>
        {rows}
        <Tr>
          <Th className="w-32 align-middle">
            <Text c="dimmed" fw={500} size="sm">
              Data Folder
            </Text>
          </Th>
          <Td className="align-middle">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconFolderOpen className="size-4" />}
              onClick={() => {
                void openPath(data.dataPath)
              }}
            >
              Open
            </Button>
          </Td>
        </Tr>
        {devRows}
        <Tr>
          <Th className="w-32 align-middle">
            <Text c="dimmed" fw={500} size="sm">
              Theme
            </Text>
          </Th>
          <Td className="align-middle">
            <ColorSchemer size="sm" />
          </Td>
        </Tr>
      </Tbody>
    </Table>
  )
}

export default AppInfo
