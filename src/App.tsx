import { AppShell, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { Link, Outlet } from "@tanstack/react-router";
import { platform } from "@tauri-apps/plugin-os"
const currentPlatform = platform();

function App() {
  return (
    <AppShell padding="lg">
      <AppShell.Header>
        <Container className="flex h-full items-center" size="lg">
          <Group justify="space-between" w="100%">
            <Title order={3}>Tauri Play - {currentPlatform}</Title>
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
                to="/about"
                variant="light"
              >
                About
              </Button>
              <Button
                component={Link}
                size="compact-sm"
                to="/todos"
                variant="light"
              >
                Todos
              </Button>
              <Link params={{ exampleId: "tauri" }} to="/examples/$exampleId">
                <Button size="compact-sm" variant="default">
                  Example
                </Button>
              </Link>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container py="xl" size="lg">
          <Stack gap="lg">
            <Stack gap={4}>
              <Text c="dimmed" size="sm">
                TanStack Router is running with browser history inside the Tauri
                webview.
              </Text>
            </Stack>
            <Outlet />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default App;
