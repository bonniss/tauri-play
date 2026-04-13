import Database from "@tauri-apps/plugin-sql";

const DATABASE_CONN = "sqlite:app.db";
let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_CONN);
  }

  return databasePromise;
}
