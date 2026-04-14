import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Paper,
  Text,
  TextInput,
} from "@mantine/core"
import { IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  createTodo,
  deleteTodo,
  listTodos,
  toggleTodo,
  type Todo,
} from "~/lib/db/domain/todos"

export const Route = createFileRoute("/todos")({
  component: TodosPage,
})

const todosQueryKey = ["todos"]

function TodosPage() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")

  const todosQuery = useQuery({
    queryKey: todosQueryKey,
    queryFn: listTodos,
  })

  const createTodoMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: async () => {
      setTitle("")
      await queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const toggleTodoMutation = useMutation({
    mutationFn: ({ completed, id }: Pick<Todo, "id" | "completed">) =>
      toggleTodo(id, completed),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: todosQueryKey })
    },
  })

  const error =
    todosQuery.error ??
    createTodoMutation.error ??
    toggleTodoMutation.error ??
    deleteTodoMutation.error

  function handleCreateTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitle = title.trim()
    if (!nextTitle) {
      return
    }

    createTodoMutation.mutate(nextTitle)
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Todo Sample</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Minimal SQLite CRUD example powered by TanStack Query.
        </p>
      </div>

      <Paper className="p-4 sm:p-5" radius="lg" withBorder>
        <form onSubmit={handleCreateTodo}>
          <Group align="flex-end" grow>
            <TextInput
              label="New todo"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Ship the desktop app"
              value={title}
            />
            <Button loading={createTodoMutation.isPending} type="submit">
              Add
            </Button>
          </Group>
        </form>
      </Paper>

      {error ? (
        <Box c="red.6">
          {error instanceof Error ? error.message : "Todo operation failed."}
        </Box>
      ) : null}

      <Paper className="p-3 sm:p-4" radius="lg" withBorder>
        {todosQuery.isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : todosQuery.data?.length ? (
          <div className="space-y-2">
            {todosQuery.data.map((todo) => (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3 py-3 dark:border-white/10"
                key={todo.id}
              >
                <Checkbox
                  checked={todo.completed}
                  disabled={toggleTodoMutation.isPending}
                  label={
                    <div className="space-y-1">
                      <Text td={todo.completed ? "line-through" : undefined}>
                        {todo.title}
                      </Text>
                      <Box c="dimmed">
                        Created at {new Date(todo.createdAt).toLocaleString()}
                      </Box>
                    </div>
                  }
                  onChange={() => {
                    toggleTodoMutation.mutate({
                      id: todo.id,
                      completed: !todo.completed,
                    })
                  }}
                />
                <ActionIcon
                  aria-label={`Delete ${todo.title}`}
                  color="red"
                  disabled={deleteTodoMutation.isPending}
                  onClick={() => {
                    deleteTodoMutation.mutate(todo.id)
                  }}
                  variant="light"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-sm text-zinc-500 dark:text-zinc-500">
            No todos yet. Add the first one above.
          </div>
        )}
      </Paper>
    </section>
  )
}
