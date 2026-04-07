import { Card, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="sm">
        <Title order={2}>About</Title>
        <Text>
          This app uses TanStack Router with file-based routing and browser history
          inside the Tauri webview.
        </Text>
        <Text c="dimmed" size="sm">
          If you add Tauri deep links later, map the incoming URL to{" "}
          <code>router.navigate()</code> at the app boundary.
        </Text>
      </Stack>
    </Card>
  );
}
