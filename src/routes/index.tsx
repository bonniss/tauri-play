import { Paper, Text } from '@mantine/core';
import { Link, createFileRoute } from '@tanstack/react-router';
import HomeHero from '~/components/home/HomeHero';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-10">
      <HomeHero />

      <div className="grid gap-4 md:grid-cols-2">
        <Paper className="p-6" radius="lg" withBorder>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Projects</h2>
            <Text c="dimmed" size="sm">
              Browse the full project directory, pin favorites, and jump back into
              labeling, training, or play mode.
            </Text>
            <Text
              c="dimmed"
              className="text-sm underline-offset-4 hover:underline"
              component={Link}
              to="/projects"
            >
              Go to project directory
            </Text>
          </div>
        </Paper>

        <Paper className="p-6" radius="lg" withBorder>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Camera</h2>
            <Text c="dimmed" size="sm">
              Open the standalone capture surface when you want to collect examples
              quickly outside a project flow.
            </Text>
            <Text
              c="dimmed"
              className="text-sm underline-offset-4 hover:underline"
              component={Link}
              to="/camera"
            >
              Go to camera
            </Text>
          </div>
        </Paper>
      </div>
    </section>
  );
}

export default HomePage;
