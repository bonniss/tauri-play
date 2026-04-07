import {
  AppShell,
  Box,
  Button,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconDeviceDesktopCog,
  IconMoon,
  IconSun,
  IconSunMoon,
} from "@tabler/icons-react";
import { Link, Outlet } from "@tanstack/react-router";
import { platform } from "@tauri-apps/plugin-os";
import { setupForm } from "react-headless-form";
import { useMemo, useState } from "react";
import { COLOR_SCHEME_STORAGE_KEY } from "./constants/storage";

const [SettingsForm] = setupForm();

function App() {
  const currentPlatform = platform();
  const [opened, setOpened] = useState(false);
  const { setColorScheme } = useMantineColorScheme();

  const initialMode = useMemo<"light" | "dark" | "system">(() => {
    const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return "system";
  }, [opened]);

  return (
    <AppShell padding="lg">
      <AppShell.Header>
        <Container className="flex h-full items-center" size="lg">
          <Group justify="space-between" w="100%">
            <Title order={3}>Tauri Starter - {currentPlatform}</Title>
            <Group gap="sm">
              <Button
                component={Link}
                size="compact-sm"
                to="/"
                variant="subtle"
              >
                Home
              </Button>
              <Button
                component={Link}
                size="compact-sm"
                to="/todos"
                variant="light"
              >
                Todo Sample
              </Button>
              <Button
                leftSection={<IconDeviceDesktopCog size={16} />}
                onClick={() => setOpened(true)}
                size="compact-sm"
                variant="default"
              >
                Settings
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container py="xl" size="lg">
          <Stack gap="lg">
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                Starter shell with Tauri, Mantine, Tailwind, TanStack Router, theme
                persistence, and SQLite wiring.
              </Text>
            </Stack>
            <Outlet />
          </Stack>
        </Container>
      </AppShell.Main>

      <Modal
        onClose={() => setOpened(false)}
        opened={opened}
        title="Settings"
      >
        <SettingsForm
          config={{
            mode: {
              type: "inline",
              render: ({
                onChange,
                value,
              }: {
                onChange?: (...args: unknown[]) => void;
                value?: "light" | "dark" | "system";
              }) => (
                <Stack gap="md">
                  <Box c="dimmed">
                    Chọn giao diện để test localStorage và behavior trong Tauri app.
                  </Box>
                  <Group grow>
                    <Button
                      color="yellow"
                      leftSection={<IconSun size={18} />}
                      onClick={() => onChange?.("light")}
                      type="button"
                      variant={value === "light" ? "filled" : "light"}
                    >
                      Light
                    </Button>
                    <Button
                      color="indigo"
                      leftSection={<IconMoon size={18} />}
                      onClick={() => onChange?.("dark")}
                      type="button"
                      variant={value === "dark" ? "filled" : "light"}
                    >
                      Dark
                    </Button>
                    <Button
                      color="gray"
                      leftSection={<IconSunMoon size={18} />}
                      onClick={() => onChange?.("system")}
                      type="button"
                      variant={value === "system" ? "filled" : "light"}
                    >
                      System
                    </Button>
                  </Group>
                </Stack>
              ),
            },
          }}
          defaultValues={{ mode: initialMode }}
          onSubmit={(data: { mode?: "light" | "dark" | "system" }) => {
            const nextMode = data.mode ?? "system";
            const storageValue = nextMode === "system" ? "auto" : nextMode;

            window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, storageValue);
            setColorScheme(storageValue);
            setOpened(false);
          }}
          renderRoot={({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) => (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {children}
              <Group justify="flex-end">
                <Button onClick={() => setOpened(false)} type="button" variant="default">
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </Group>
            </form>
          )}
        />
      </Modal>
    </AppShell>
  );
}

export default App;
