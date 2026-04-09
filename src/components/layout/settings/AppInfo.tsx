import { Button, Group, Loader, Table, Text } from "@mantine/core"
import { IconFolderOpen } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import {
  getIdentifier,
  getName,
  getTauriVersion,
  getVersion,
} from "@tauri-apps/api/app"
import { appDataDir } from "@tauri-apps/api/path"
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

async function getAppInfo() {
  const [
    dataPath,
    appName,
    appVersion,
    identifier,
    tauriVersion,
    systemArch,
    systemFamily,
    systemLocale,
    systemPlatform,
    systemType,
    systemVersion,
  ] = await Promise.all([
    appDataDir(),
    getName(),
    getVersion(),
    getIdentifier(),
    getTauriVersion(),
    arch(),
    family(),
    locale(),
    platform(),
    osType(),
    osVersion(),
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
    tauriVersion,
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
      <Group gap="xs">
        <Loader size="sm" />
        <Text c="dimmed" size="sm">
          Loading app info...
        </Text>
      </Group>
    )
  }

  if (error) {
    return (
      <Text c="red.6" size="sm">
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
  ]

  if (isDev) {
    rows.push({ label: "Tauri", value: data.tauriVersion })
  }

  return (
    <Table withRowBorders layout="fixed">
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.label}>
            <Table.Th className="w-28 align-top">
              <Text c="dimmed" fw={500} size="sm">
                {row.label}
              </Text>
            </Table.Th>
            <Table.Td className="font-mono">{row.value}</Table.Td>
          </Table.Tr>
        ))}
        <Table.Tr>
          <Table.Th className="w-28 align-middle">
            <Text c="dimmed" fw={500} size="sm">
              Data Folder
            </Text>
          </Table.Th>
          <Table.Td className="align-middle">
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
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Th className="w-28 align-middle">
            <Text c="dimmed" fw={500} size="sm">
              Theme
            </Text>
          </Table.Th>
          <Table.Td className="align-middle">
            <ColorSchemer size="sm" />
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  )
}

export default AppInfo
