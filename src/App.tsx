import { AppShell, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { Link, Outlet } from "@tanstack/react-router";

function App() {
  return (
    <AppShell padding="lg">
      <AppShell.Header>
        <Container className="flex h-full items-center" size="lg">
          <Group justify="space-between" w="100%">
            <Title order={3}>Tauri Play</Title>
            <Group gap="sm">
              <Button component={Link} size="compact-sm" to="/" variant="subtle">
                Home
              </Button>
              <Button component={Link} size="compact-sm" to="/about" variant="light">
                About
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
                TanStack Router is running with browser history inside the Tauri webview.
              </Text>
            </Stack>
            <Outlet />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
