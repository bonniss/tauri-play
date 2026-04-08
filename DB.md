# DB.md

## Goal

This repo uses SQLite as the local database for the desktop app, with this approach:

- keep migrations on the native side as SQL files in `src-tauri/migrations`
- write frontend queries with Kysely
- keep SQL out of UI components

This is a good balance for Tauri:

- runtime migrations stay reliable and easy to control
- queries are cleaner and more typed than raw SQL
- no separate Node backend is required
- it still works with `@tauri-apps/plugin-sql`

## Current Stack

- SQLite file via `@tauri-apps/plugin-sql`
- preload and migrations registered in `src-tauri/src/lib.rs`
- Kysely running on the frontend through a custom dialect in `src/lib/db/kysely.ts`
- query modules under `src/lib/db`

## Why This Approach

We do not use raw SQL in routes/components because it:

- gets hard to read and refactor
- tends to spread and duplicate
- makes it too easy to drift into unsafe string building

We do not use Kysely migrations as the primary migration system because:

- in this Tauri app, Rust-side SQL migrations are simpler and more reliable
- we do not need to build a frontend migration runner
- migrations follow the native app lifecycle automatically

In short:

- schema changes: SQL migrations
- app queries: Kysely

## Standard Workflow

### 1. Change the schema

When you need a new table or column:

1. create a new SQL file in `src-tauri/migrations`
2. register that migration in `src-tauri/src/lib.rs`
3. do not edit old migrations that have already shipped

Example:

```text
src-tauri/migrations/0002_add_due_date_to_todos.sql
```

## 2. Update the TypeScript schema

After changing the database schema, update the types in:

- `src/lib/db/kysely.ts`

This is where `DatabaseSchema` is defined for Kysely.

## 3. Write queries

Write queries in dedicated modules under `src/lib/db`, for example:

- `src/lib/db/todos.ts`

Do not put SQL or query logic in routes/components.

Example:

```ts
const rows = await db
  .selectFrom("todos")
  .select(["id", "title", "completed", "created_at"])
  .orderBy("id", "desc")
  .execute()
```

## 4. Use queries in UI

Routes or components should call the data layer, usually through TanStack Query:

- `useQuery` for reads
- `useMutation` for writes

UI should not know SQL strings or connection details.

## Short Rules

- Do not write SQL in route files.
- Do not build queries by concatenating user input.
- Do not call `Database.load(...)` all over the UI.
- Keep all DB access inside `src/lib/db`.
- Every schema change gets a new migration.

## Important Insight

### Kysely here is not a browser database

Kysely runs in frontend code, but the database does not live in the browser.

The real flow is:

```text
React -> Kysely -> custom Tauri dialect -> plugin-sql -> SQLite file
```

That means:

- no Node runtime is required
- but a Tauri native bridge is still required

## Database File Location

With the current connection string:

```text
sqlite:todo.db
```

the `todo.db` file does not live in the repo.

It lives in the app data/config directory for the application:

- during dev: in the app data dir for the dev app
- after distribution: in the app data dir for the installed app

It does not live in:

- the project root
- `src-tauri`
- `dist`
- the folder containing the `.exe`

## When to Change Direction

Keep the current approach if:

- the app is local-first
- queries are mostly CRUD and normal filtering
- you want fast frontend iteration

Consider moving DB logic down to Rust if:

- transactions become more complex
- business logic becomes more sensitive
- you need a stricter boundary between UI and data logic

## Files To Remember

- `src-tauri/src/lib.rs`
- `src-tauri/migrations/`
- `src/lib/db/client.ts`
- `src/lib/db/kysely.ts`
- `src/lib/db/todos.ts`
- `src/routes/todos.tsx`
