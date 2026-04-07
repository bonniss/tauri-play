import Database from "@tauri-apps/plugin-sql";

const TODO_DATABASE = "sqlite:todo.db";

let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(TODO_DATABASE);
  }

  return databasePromise;
}
