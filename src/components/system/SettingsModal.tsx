import {
  Box,
  Button,
  Code,
  Group,
  Modal,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconFolderOpen,
  IconMoon,
  IconSun,
  IconSunMoon,
} from "@tabler/icons-react";
import {
  getIdentifier,
  getName,
  getTauriVersion,
  getVersion,
} from "@tauri-apps/api/app";
import { appDataDir } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  arch,
  family,
  locale,
  platform,
  type as osType,
  version,
} from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";
import { COLOR_SCHEME_STORAGE_KEY } from "../../constants/storage";

function getStoredThemeMode(): "light" | "dark" | "system" {
  const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "system";
}

export function SettingsModal({
  onClose,
  opened,
}: {
  onClose: () => void;
  opened: boolean;
}) {
  const { setColorScheme } = useMantineColorScheme();
  const [currentMode, setCurrentMode] = useState<"light" | "dark" | "system">(
    getStoredThemeMode(),
  );
  const [dataPath, setDataPath] = useState("");
  const [pathError, setPathError] = useState<string | null>(null);
  const [appInfo, setAppInfo] = useState<{
    appName: string;
    appVersion: string;
    identifier: string;
    osArch: string;
    osFamily: string;
    osLocale: string;
    osPlatform: string;
    osTypeName: string;
    osVersion: string;
    tauriVersion: string;
  } | null>(null);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setCurrentMode(getStoredThemeMode());

    void (async () => {
      try {
        setPathError(null);
        const [resolvedDataPath, appName, appVersion, identifier, tauriVersion, osArch, osFamily, osLocale, osPlatform, osTypeName, osVersion] =
          await Promise.all([
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
          ]);

        setDataPath(resolvedDataPath);
        setAppInfo({
          appName,
          appVersion,
          identifier,
          osArch,
          osFamily,
          osLocale: osLocale ?? "Unknown",
          osPlatform,
          osTypeName,
          osVersion,
          tauriVersion,
        });
      } catch (cause) {
        setPathError(
          cause instanceof Error ? cause.message : "Failed to resolve system info.",
        );
      }
    })();
  }, [opened]);

  function applyThemeMode(mode: "light" | "dark" | "system") {
    const storageValue = mode === "system" ? "auto" : mode;

    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, storageValue);
    setCurrentMode(mode);
    setColorScheme(storageValue);
  }

  async function handleOpenDataFolder() {
    if (!dataPath) {
      return;
    }

    await openPath(dataPath);
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
          <Text fw={600}>Data</Text>
          {pathError ? (
            <Box c="red.6">{pathError}</Box>
          ) : (
            <Code block>{dataPath || "Resolving..."}</Code>
          )}
          <Group justify="flex-end">
            <Button
              leftSection={<IconFolderOpen size={16} />}
              onClick={() => {
                void handleOpenDataFolder();
              }}
              type="button"
              variant="default"
            >
              Open User Data Folder
            </Button>
          </Group>
        </Stack>

        <Stack gap="xs">
          <Text fw={600}>App Info</Text>
          <Stack gap={6}>
            <InfoRow label="App" value={appInfo?.appName ?? "Resolving..."} />
            <InfoRow label="Version" value={appInfo?.appVersion ?? "Resolving..."} />
            <InfoRow label="Identifier" value={appInfo?.identifier ?? "Resolving..."} />
            <InfoRow label="Tauri" value={appInfo?.tauriVersion ?? "Resolving..."} />
            <InfoRow label="Platform" value={appInfo?.osPlatform ?? "Resolving..."} />
            <InfoRow label="OS Type" value={appInfo?.osTypeName ?? "Resolving..."} />
            <InfoRow label="OS Version" value={appInfo?.osVersion ?? "Resolving..."} />
            <InfoRow label="Family" value={appInfo?.osFamily ?? "Resolving..."} />
            <InfoRow label="Arch" value={appInfo?.osArch ?? "Resolving..."} />
            <InfoRow label="Locale" value={appInfo?.osLocale ?? "Resolving..."} />
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Group align="flex-start" justify="space-between" wrap="nowrap">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Code>{value}</Code>
    </Group>
  );
}
