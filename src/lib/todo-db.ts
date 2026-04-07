import Database from "@tauri-apps/plugin-sql";

const TODO_DATABASE = "sqlite:todo.db";

type TodoRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

let databasePromise: Promise<Database> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(TODO_DATABASE);
  }

  return databasePromise;
}

function mapTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export async function listTodos() {
  const db = await getDatabase();
  const rows = await db.select<TodoRow[]>(
    "SELECT id, title, completed, created_at FROM todos ORDER BY id DESC",
  );

  return rows.map(mapTodo);
}

export async function createTodo(title: string) {
  const db = await getDatabase();
  await db.execute("INSERT INTO todos (title) VALUES (?)", [title.trim()]);
}

export async function toggleTodo(id: number, completed: boolean) {
  const db = await getDatabase();
  await db.execute("UPDATE todos SET completed = ? WHERE id = ?", [
    completed ? 1 : 0,
    id,
  ]);
}

export async function deleteTodo(id: number) {
  const db = await getDatabase();
  await db.execute("DELETE FROM todos WHERE id = ?", [id]);
}
