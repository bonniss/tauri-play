import Database from "@tauri-apps/plugin-sql";

const DATABASE_CONN = "sqlite:app.db";
let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await Database.load(DATABASE_CONN);

      // Reduce reader/writer contention and let SQLite wait briefly
      // instead of failing immediately when another statement is active.
      await database.execute("PRAGMA journal_mode = WAL");
      await database.execute("PRAGMA busy_timeout = 5000");
      await database.execute("PRAGMA foreign_keys = ON");

      return database;
    })();
  }

  return databasePromise;
}
