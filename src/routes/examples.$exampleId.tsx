import { Badge, Card, Code, Group, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/examples/$exampleId")({
  component: ExampleRoutePage,
});

function ExampleRoutePage() {
  const { exampleId } = Route.useParams();

  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Dynamic Example Route</Title>
            <Text c="dimmed" size="sm">
              This page comes from a single file that handles dynamic params.
            </Text>
          </div>
          <Badge size="lg" variant="light">
            {exampleId}
          </Badge>
        </Group>

        <Text>
          Current matched file:
          {" "}
          <Code>src/routes/examples.$exampleId.tsx</Code>
        </Text>
        <Text>
          Current URL param:
          {" "}
          <Code>{exampleId}</Code>
        </Text>
        <Text c="dimmed" size="sm">
          In Tauri this behaves like a normal SPA route inside the webview. TanStack
          Router reads the path, extracts params, and renders the same component file.
        </Text>

        <Group gap="md">
          <Link params={{ exampleId: "desktop" }} to="/examples/$exampleId">
            <Text component="span">desktop</Text>
          </Link>
          <Link params={{ exampleId: "native-shell" }} to="/examples/$exampleId">
            <Text component="span">native-shell</Text>
          </Link>
          <Link params={{ exampleId: "deep-link-ready" }} to="/examples/$exampleId">
            <Text component="span">deep-link-ready</Text>
          </Link>
        </Group>
      </Stack>
    </Card>
  );
}
