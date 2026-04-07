import { Box, Card, Code, Group, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <Stack gap="lg">
      <Card padding="lg" radius="lg" shadow="sm" withBorder>
        <Stack gap="md">
          <div>
            <Title order={2}>Starter Overview</Title>
            <Text c="dimmed" size="sm">
              This repo is shaped to become a reusable Tauri starter, not a product
              demo.
            </Text>
          </div>

          <Group align="flex-start" grow>
            <Stack gap={6}>
              <Text fw={600}>What is already wired</Text>
              <Box c="dimmed">Tauri desktop shell</Box>
              <Box c="dimmed">React + TypeScript + Vite</Box>
              <Box c="dimmed">Mantine theme and settings modal</Box>
              <Box c="dimmed">Tailwind for layout and basic text styling</Box>
              <Box c="dimmed">TanStack Router with file-based routing</Box>
              <Box c="dimmed">SQLite sample with migrations</Box>
            </Stack>

            <Stack gap={6}>
              <Text fw={600}>Useful starting points</Text>
              <Box c="dimmed">
                Routes live in <Code>src/routes</Code>
              </Box>
              <Box c="dimmed">
                Providers live in <Code>src/AppProvider.tsx</Code>
              </Box>
              <Box c="dimmed">
                SQLite sample lives in <Code>src/routes/todos.tsx</Code>
              </Box>
              <Box c="dimmed">
                Native setup lives in <Code>src-tauri</Code>
              </Box>
            </Stack>
          </Group>
        </Stack>
      </Card>

      <Card padding="lg" radius="lg" shadow="sm" withBorder>
        <Stack gap="sm">
          <Title order={3}>Template Direction</Title>
          <Text c="dimmed" size="sm">
            Keep this starter opinionated enough to move fast, but small enough that
            a new app can replace pieces without fighting boilerplate.
          </Text>
          <Box c="dimmed">
            Suggested next step after cloning: rename app metadata, keep the shell,
            keep settings/theme, then either extend or remove the SQLite sample.
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
