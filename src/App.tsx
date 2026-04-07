import { AppShell, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconDeviceDesktopCog } from "@tabler/icons-react";
import { Link, Outlet } from "@tanstack/react-router";
import { platform } from "@tauri-apps/plugin-os";
import { useState } from "react";
import { SettingsModal } from "./components/system/SettingsModal";

function App() {
  const currentPlatform = platform();
  const [opened, setOpened] = useState(false);

  return (
    <AppShell padding="lg">
      <AppShell.Header>
        <Container className="flex h-full items-center" size="lg">
          <Group justify="space-between" w="100%">
            <Title order={3}>Tauri Starter - {currentPlatform}</Title>
            <Group gap="sm">
              <Button component={Link} size="compact-sm" to="/" variant="subtle">
                Home
              </Button>
              <Button component={Link} size="compact-sm" to="/todos" variant="light">
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

      <SettingsModal onClose={() => setOpened(false)} opened={opened} />
    </AppShell>
  );
}

export default App;
