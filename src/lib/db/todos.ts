import { getKysely } from "./kysely";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
};

function mapTodo(row: { completed: number; created_at: string; id: number; title: string }): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}

export async function listTodos() {
  const db = getKysely();
  const rows = await db
    .selectFrom("todos")
    .select(["id", "title", "completed", "created_at"])
    .orderBy("id", "desc")
    .execute();

  return rows.map(mapTodo);
}

export async function createTodo(title: string) {
  const db = getKysely();
  await db.insertInto("todos").values({ title: title.trim() }).execute();
}

export async function toggleTodo(id: number, completed: boolean) {
  const db = getKysely();
  await db
    .updateTable("todos")
    .set({ completed: completed ? 1 : 0 })
    .where("id", "=", id)
    .execute();
}

export async function deleteTodo(id: number) {
  const db = getKysely();
  await db.deleteFrom("todos").where("id", "=", id).execute();
}
