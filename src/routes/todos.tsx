import {
  ActionIcon,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  createTodo,
  deleteTodo,
  listTodos,
  toggleTodo,
  type Todo,
} from "~/lib/db/todos";

export const Route = createFileRoute("/todos")({
  component: TodosPage,
});

function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshTodos() {
    try {
      setError(null);
      setTodos(await listTodos());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to load todos.");
    } finally {
      setIsLoading(false);
      setIsSaving(false);
    }
  }

  useEffect(() => {
    void refreshTodos();
  }, []);

  async function handleCreateTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }

    try {
      setIsSaving(true);
      await createTodo(nextTitle);
      setTitle("");
      await refreshTodos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create todo.");
      setIsSaving(false);
    }
  }

  async function handleToggleTodo(todo: Todo) {
    try {
      setIsSaving(true);
      await toggleTodo(todo.id, !todo.completed);
      await refreshTodos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to update todo.");
      setIsSaving(false);
    }
  }

  async function handleDeleteTodo(id: number) {
    try {
      setIsSaving(true);
      await deleteTodo(id);
      await refreshTodos();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to delete todo.");
      setIsSaving(false);
    }
  }

  return (
    <Card padding="lg" radius="lg" shadow="sm" withBorder>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2}>SQLite Todo Demo</Title>
          <Box c="dimmed">
            This page stores todos in a real SQLite database through the official
            Tauri SQL plugin.
          </Box>
        </Stack>

        <form onSubmit={handleCreateTodo}>
          <Group align="flex-end" grow>
            <TextInput
              label="New todo"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Ship the desktop app"
              value={title}
            />
            <Button loading={isSaving} type="submit">
              Add
            </Button>
          </Group>
        </form>

        {error ? <Box c="red.6">{error}</Box> : null}

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
          <Stack gap="sm">
            {todos.length === 0 ? (
              <Box c="dimmed">No todos yet. Add the first one above.</Box>
            ) : (
              todos.map((todo) => (
                <Card key={todo.id} padding="md" radius="md" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Checkbox
                      checked={todo.completed}
                      label={
                        <Stack gap={2}>
                          <Text td={todo.completed ? "line-through" : undefined}>
                            {todo.title}
                          </Text>
                          <Box c="dimmed">
                            Created at {new Date(todo.createdAt).toLocaleString()}
                          </Box>
                        </Stack>
                      }
                      onChange={() => {
                        void handleToggleTodo(todo);
                      }}
                    />
                    <ActionIcon
                      aria-label={`Delete ${todo.title}`}
                      color="red"
                      onClick={() => {
                        void handleDeleteTodo(todo.id);
                      }}
                      variant="light"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
