import { Button, Paper, Text } from '@mantine/core';
import { Link, createFileRoute } from '@tanstack/react-router';
import { IconCamera, IconFolders } from '@tabler/icons-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-10">
      <div className="space-y-4">
        <Text c="dimmed" className="font-mono" size="sm">
          Local-first image classification workbench
        </Text>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl">
          Build datasets, train models, and open playable demos from one desktop app.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
          Use Projects to manage label data and training. Use Camera for quick capture
          experiments and live collection flows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Paper className="p-6" radius="lg" withBorder>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                <IconFolders className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Projects</h2>
                <Text c="dimmed" size="sm">
                  Browse, create, and organize project workspaces.
                </Text>
              </div>
            </div>
            <Button component={Link} to="/projects">
              Open Projects
            </Button>
          </div>
        </Paper>

        <Paper className="p-6" radius="lg" withBorder>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                <IconCamera className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Camera</h2>
                <Text c="dimmed" size="sm">
                  Open the standalone capture screen for quick collection.
                </Text>
              </div>
            </div>
            <Button component={Link} to="/camera" variant="default">
              Open Camera
            </Button>
          </div>
        </Paper>
      </div>
    </section>
  );
}

export default HomePage;
