import Database from "@tauri-apps/plugin-sql"
import {
  ColumnType,
  Generated,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely"
import type {
  CompiledQuery,
  DatabaseConnection,
  Dialect,
  DialectAdapter,
  Driver,
  KyselyConfig,
  QueryResult,
  QueryCompiler,
  TransactionSettings,
} from "kysely"
import { getDatabase } from "./client"

type TodoTable = {
  id: Generated<number>
  title: string
  completed: ColumnType<number, number | undefined, number>
  created_at: ColumnType<string, string | undefined, never>
}

type ProjectTable = {
  id: string
  name: string
  status: "draft" | "active" | "archived"
  task_type: string
  description: string | null
  settings: string
  created_at: ColumnType<string, string | undefined, never>
  updated_at: ColumnType<string, string | undefined, string>
}

type ClassTable = {
  id: string
  project_id: string
  name: string
  description: string | null
  order: ColumnType<number, number | undefined, number>
  created_at: ColumnType<string, string | undefined, never>
  updated_at: ColumnType<string, string | undefined, string>
}

type SampleTable = {
  id: string
  project_id: string
  class_id: string
  file_path: string
  mime_type: string | null
  width: number | null
  height: number | null
  original_file_name: string | null
  original_file_path: string | null
  file_size: number | null
  last_modified_at: string | null
  content_hash: string | null
  extra_metadata: string | null
  source: "camera" | "upload"
  order: ColumnType<number, number | undefined, number>
  created_at: ColumnType<string, string | undefined, never>
}

type ModelTable = {
  id: string
  project_id: string
  artifact_path: string
  trained_at: string
  accuracy: number | null
  validation_accuracy: number | null
  loss: number | null
  validation_loss: number | null
  settings_snapshot: string | null
  dataset_snapshot: string | null
  created_at: ColumnType<string, string | undefined, never>
  updated_at: ColumnType<string, string | undefined, string>
}

type ModelTrainLogTable = {
  id: string
  project_id: string
  model_id: string | null
  status: "started" | "completed" | "failed" | "cancelled"
  started_at: string
  ended_at: string | null
  settings_snapshot: string
  dataset_snapshot: string
  summary_json: string | null
  log_json: string
  created_at: ColumnType<string, string | undefined, never>
  updated_at: ColumnType<string, string | undefined, string>
}

type AppSettingsTable = {
  key: string
  value: string
  updated_at: ColumnType<string, string | undefined, string>
}

export interface DatabaseSchema {
  app_settings: AppSettingsTable
  classes: ClassTable
  models: ModelTable
  model_train_logs: ModelTrainLogTable
  projects: ProjectTable
  samples: SampleTable
  todos: TodoTable
}

class TauriSqliteConnection implements DatabaseConnection {
  constructor(private readonly database: Database) {}

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const sql = compiledQuery.sql.trim().toLowerCase()

    if (sql.startsWith("select") || sql.startsWith("pragma")) {
      const rows = await this.database.select<O[]>(
        compiledQuery.sql,
        compiledQuery.parameters as unknown[],
      )

      return {
        rows,
      }
    }

    const result = await this.database.execute(
      compiledQuery.sql,
      compiledQuery.parameters as unknown[],
    )

    return {
      numAffectedRows: BigInt(result.rowsAffected),
      rows: [],
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Streaming queries are not supported by the Tauri SQL plugin.")
  }
}

class TauriSqliteDriver implements Driver {
  private connection: DatabaseConnection | null = null
  private database: Database | null = null

  async init(): Promise<void> {
    const database = await getDatabase()
    this.database = database
    this.connection = new TauriSqliteConnection(database)
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      throw new Error("Kysely driver not initialized.")
    }

    return this.connection
  }

  async beginTransaction(_connection: DatabaseConnection): Promise<void> {
    if (!this.database) {
      throw new Error("Kysely driver not initialized.")
    }

    await this.database.execute("begin")
  }

  async commitTransaction(_connection: DatabaseConnection): Promise<void> {
    if (!this.database) {
      throw new Error("Kysely driver not initialized.")
    }

    await this.database.execute("commit")
  }

  async rollbackTransaction(_connection: DatabaseConnection): Promise<void> {
    if (!this.database) {
      throw new Error("Kysely driver not initialized.")
    }

    await this.database.execute("rollback")
  }

  async releaseConnection(): Promise<void> {}

  async destroy(): Promise<void> {
    this.connection = null
    this.database = null
  }

  async beginTransactionSettings(
    _connection: DatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {}
}

class TauriSqliteDialect implements Dialect {
  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createDriver(): Driver {
    return new TauriSqliteDriver()
  }

  createIntrospector(db: Kysely<unknown>) {
    return new SqliteIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }
}

let kyselyInstance: Kysely<DatabaseSchema> | null = null

export function getKysely() {
  if (!kyselyInstance) {
    kyselyInstance = new Kysely<DatabaseSchema>({
      dialect: new TauriSqliteDialect(),
    } satisfies KyselyConfig)
  }

  return kyselyInstance
}
