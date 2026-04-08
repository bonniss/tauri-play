import {
  Button,
  Code,
  Flex,
  Group,
  Modal,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core"
import {
  IconFolderOpen,
  IconMoon,
  IconSun,
  IconSunMoon,
} from "@tabler/icons-react"
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
  platform,
  version,
} from "@tauri-apps/plugin-os"
import { type ReactNode, useEffect, useState } from "react"
import { COLOR_SCHEME_STORAGE_KEY } from "../../constants/storage"

function getStoredThemeMode(): "light" | "dark" | "system" {
  const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)

  if (stored === "light" || stored === "dark") {
    return stored
  }

  return "system"
}

export function SettingsModal({
  onClose,
  opened,
}: {
  onClose: () => void
  opened: boolean
}) {
  const { setColorScheme } = useMantineColorScheme()
  const [currentMode, setCurrentMode] = useState<"light" | "dark" | "system">(
    getStoredThemeMode(),
  )
  const [pathError, setPathError] = useState<string | null>(null)
  const [appInfo, setAppInfo] = useState<{
    appName: string
    appVersion: string
    dataPath: string
    identifier: string
    osArch: string
    osLocale: string
    osPlatform: string
    osTypeName: string
    osVersion: string
    tauriVersion: string
  } | null>(null)

  useEffect(() => {
    if (!opened) {
      return
    }

    setCurrentMode(getStoredThemeMode())

    void (async () => {
      try {
        setPathError(null)
        const [
          resolvedDataPath,
          appName,
          appVersion,
          identifier,
          tauriVersion,
          osArch,
          osFamily,
          osLocale,
          osPlatform,
          osTypeName,
          osVersion,
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
          version(),
        ])

        setAppInfo({
          appName,
          appVersion,
          dataPath: resolvedDataPath,
          identifier,
          osArch,
          osLocale: osLocale ?? "Unknown",
          osPlatform,
          osTypeName: osTypeName || osFamily,
          osVersion: osVersion || "Unknown",
          tauriVersion,
        })
      } catch (cause) {
        setPathError(
          cause instanceof Error
            ? cause.message
            : "Failed to resolve system info.",
        )
      }
    })()
  }, [opened])

  function applyThemeMode(mode: "light" | "dark" | "system") {
    const storageValue = mode === "system" ? "auto" : mode

    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, storageValue)
    setCurrentMode(mode)
    setColorScheme(storageValue)
  }

  async function handleOpenDataFolder() {
    if (!appInfo?.dataPath) {
      return
    }

    await openPath(appInfo.dataPath)
  }

  return (
    <Modal onClose={onClose} opened={opened} title="Settings">
      <Stack gap="lg">
        <Stack gap="xs">
          <Text fw={600}>Theme</Text>
          <Group grow>
            <Button
              color="yellow"
              leftSection={<IconSun size={18} />}
              onClick={() => applyThemeMode("light")}
              type="button"
              variant={currentMode === "light" ? "filled" : "light"}
            >
              Light
            </Button>
            <Button
              color="indigo"
              leftSection={<IconMoon size={18} />}
              onClick={() => applyThemeMode("dark")}
              type="button"
              variant={currentMode === "dark" ? "filled" : "light"}
            >
              Dark
            </Button>
            <Button
              color="gray"
              leftSection={<IconSunMoon size={18} />}
              onClick={() => applyThemeMode("system")}
              type="button"
              variant={currentMode === "system" ? "filled" : "light"}
            >
              System
            </Button>
          </Group>
        </Stack>
        <Stack gap="xs">
          <Text fw={600}>App Info</Text>
          <Stack gap={6}>
            <InfoRow label="App" value={appInfo?.appName ?? "Resolving..."} />
            <InfoRow
              label="Version"
              value={appInfo?.appVersion ?? "Resolving..."}
            />
            <InfoRow
              label="Identifier"
              value={appInfo?.identifier ?? "Resolving..."}
            />
            <InfoRow
              label="Platform"
              value={appInfo?.osPlatform ?? "Resolving..."}
            />
            <InfoRow
              label="OS"
              value={
                appInfo
                  ? `${appInfo.osTypeName} ${appInfo.osVersion}`.trim()
                  : "Resolving..."
              }
            />
            <InfoRow label="Arch" value={appInfo?.osArch ?? "Resolving..."} />
            <InfoRow
              label="Locale"
              value={appInfo?.osLocale ?? "Resolving..."}
            />

            <InfoRow
              label="Data Folder"
              value={""}
              action={
                <Button
                  leftSection={<IconFolderOpen className="size-3.5" />}
                  disabled={Boolean(pathError) || !appInfo?.dataPath}
                  onClick={() => {
                    void handleOpenDataFolder()
                  }}
                  size="compact-xs"
                  type="button"
                  variant="default"
                >
                  Open
                </Button>
              }
            />
            {import.meta.env.DEV ? (
              <InfoRow
                label="Tauri"
                value={appInfo?.tauriVersion ?? "Resolving..."}
              />
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  )
}

function InfoRow({
  action,
  label,
  value,
}: {
  action?: ReactNode
  label: string
  value: string
}) {
  return (
    <Group align="flex-start" justify="space-between" wrap="nowrap">
      <Text c="dimmed" miw={88} size="sm">
        {label}
      </Text>
      <Flex align="center" className="min-w-0 flex-1 justify-end gap-2">
        <Code className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap sm:max-w-[280px]">
          {value}
        </Code>
        {action}
      </Flex>
    </Group>
  )
}
