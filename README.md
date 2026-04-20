# Tauri Starter

A reusable desktop app starter built with:

- Tauri 2
- React 19 + TypeScript
- Vite 7
- Mantine 9
- Tailwind CSS v3
- TanStack Router with file-based routing
- SQLite via Tauri SQL plugin


## Features

### Platform

- **Easy to install** — desktop app, install and run, no additional setup required
- **No account required** — you own the machine, you own the app
- **100% offline** — no internet needed to train or run predictions
- **Cross-platform** — Windows, macOS, Linux

### Core features

- **Fast training** — results in seconds from just a few dozen images; small CPU and memory footprint
- **Unlimited projects** — as many projects, classes, and samples as your disk allows; no artificial caps
- **Sensible defaults** — works great out of the box; easy to customize epochs, batch size, and more when needed
- **Flexible input** — collect images directly from your camera or upload an existing dataset; mix both freely
- **Intuitive Play** — test your model live with a clean, real-time interface; upload or use your camera
- **Easy sharing** — share a demo of your project or export your trained model to use in other apps

## What this starter already includes

- App shell and header navigation
- Settings modal with light, dark, and system theme persistence
- File-based routing
- SQLite wiring with migrations
- A small todo sample that demonstrates local persistence
- Basic project docs for contributors and future cloning

## Quick start

Install dependencies:

```powershell
corepack enable
pnpm install
```

Run frontend only:

```powershell
corepack pnpm dev
```

Run the Tauri desktop app:

```powershell
corepack pnpm dev:app
```

Build frontend:

```powershell
corepack pnpm build
```

Build desktop app:

```powershell
corepack pnpm build:app
```

## Bootstrap a new app name

After cloning this starter, you can rename the main metadata in one shot with:

```powershell
.\scripts\bootstrap.ps1 -PackageName "my-app" -ProductName "My App" -Identifier "com.example.my-app"
```

This updates:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/src/main.rs`
- header title in `src/App.tsx`

After running it:

```powershell
corepack pnpm build
cargo check --manifest-path .\src-tauri\Cargo.toml
```

## Important routes

- `/`
  Starter overview page

- `/todos`
  SQLite sample page with real CRUD

## Project structure

```text
src/
  constants/
  lib/
    db/
  providers/
  router/
  routes/
  theme/
  App.tsx
  main.tsx

src-tauri/
  capabilities/
  migrations/
  src/
  tauri.conf.json
```

## When cloning this starter for a new app

Fastest path:

1. Run `.\scripts\bootstrap.ps1`
2. Review `src/App.tsx`
3. Review `src/constants/storage.ts` if you want product-specific keys
4. Decide whether to keep the `/todos` sample

If you want to update values manually, change:

- `package.json` -> `name`
- `src-tauri/Cargo.toml` -> `name`, `description`, `lib.name`
- `src-tauri/tauri.conf.json` -> `productName`, `identifier`, window title
- header title in `src/App.tsx`
- storage keys if you want product-specific names

Then decide:

- keep or remove the `/todos` SQLite sample
- keep or replace the default Mantine theme
- keep or replace the settings modal

## Notes

- Do not edit `src/routeTree.gen.ts` manually.
- Run `corepack pnpm routes:gen` if route types look stale.
- SQLite sample and migration docs are in `DB.md`.
- Development conventions are in `AGENTS.md`.
