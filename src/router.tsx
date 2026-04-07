import { Button, Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import App from "./App";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}

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
      </Stack>
    </Card>
  );
}

function AboutPage() {
  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="sm">
        <Title order={2}>About</Title>
        <Text>
          This app uses TanStack Router with the default browser history, which works
          well in a Tauri webview.
        </Text>
        <Text c="dimmed" size="sm">
          If you add Tauri deep links later, map the incoming URL to{" "}
          <code>router.navigate()</code> at the app boundary.
        </Text>
      </Stack>
    </Card>
  );
}
