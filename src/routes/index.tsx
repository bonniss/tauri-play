import { Anchor, Button, Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke<string>("greet", { name }));
  }

  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="md">
        <div>
          <Title order={2}>Home</Title>
          <Text c="dimmed" size="sm">
            This route proves SPA navigation works normally inside Tauri.
          </Text>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void greet();
          }}
        >
          <Stack gap="sm">
            <TextInput
              id="greet-input"
              label="Name"
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Enter a name..."
              value={name}
            />
            <Group justify="flex-start">
              <Button type="submit">Greet via Rust</Button>
            </Group>
          </Stack>
        </form>

        <Text>{greetMsg || "Waiting for a Rust command..."}</Text>

        <Stack gap={4}>
          <Text c="dimmed" size="sm">
            File-based routing examples:
          </Text>
          <Group gap="md">
            <Link params={{ exampleId: "tauri" }} to="/examples/$exampleId">
              <Anchor component="span">/examples/tauri</Anchor>
            </Link>
            <Link params={{ exampleId: "mantine" }} to="/examples/$exampleId">
              <Anchor component="span">/examples/mantine</Anchor>
            </Link>
            <Link params={{ exampleId: "router" }} to="/examples/$exampleId">
              <Anchor component="span">/examples/router</Anchor>
            </Link>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
