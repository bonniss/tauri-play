# AGENTS.md

## Overview

This repository is a reusable desktop app starter built with:

- Tauri 2 for the native shell and Rust backend
- React 19 + TypeScript for the frontend
- Vite 7 for frontend bundling and dev server
- TanStack Router with file-based routing
- Mantine 9 for functional UI components and theme
- Tailwind CSS v3 for layout and basic text styling
- `react-easy-provider` for app-level provider composition
- `react-headless-form` for lightweight config-driven forms

Current frontend structure:

- `src/providers/AppProvider.tsx`: app-wide providers and Mantine theme
- `src/router/index.tsx`: router setup
- `src/routes/`: file-based routes
- `src/theme/`: Mantine theme setup
- `src/constants/`: shared app constants
- `src/lib/db/`: SQLite access layer
- `src/App.tsx`: root layout shell

Current native structure:

- `src-tauri/src/main.rs`: native entrypoint
- `src-tauri/src/lib.rs`: Tauri app builder and Rust commands
- `src-tauri/migrations/`: SQLite migrations
- `src-tauri/capabilities/`: Tauri permissions

## Environment

Recommended baseline on any device:

- Node.js 20+ or 24 LTS
- `pnpm` via Corepack
- Rust stable toolchain
- Tauri prerequisites for the target OS

On a fresh machine:

```powershell
corepack enable
pnpm install
cargo check --manifest-path .\src-tauri\Cargo.toml
```

## Run

Frontend only:

```powershell
corepack pnpm dev
```

Desktop app in Tauri:

```powershell
corepack pnpm dev:app
```

Generate route tree manually:

```powershell
corepack pnpm routes:gen
```

Production frontend build:

```powershell
corepack pnpm build
```

Desktop bundle:

```powershell
corepack pnpm build:app
```

## UI Practices

Use the tools by responsibility, not by preference:

- Use Tailwind for layout, spacing, flex/grid, sizing, positioning, and basic text styling.
- Use Mantine for functional UI components: forms, buttons, overlays, cards, navigation, inputs, app shell, feedback states.
- For quick text color that needs to work across light and dark themes, prefer Mantine props like `c`, for example `Box c="dimmed"` or `Text c="orange.4"`.
- Keep Mantine theme concerns centralized in `src/providers/AppProvider.tsx`.
- Keep storage keys and app-level constants in `src/constants`.
- Keep route-level UI inside `src/routes`.

Practical rule of thumb:

- Layout skeleton: Tailwind
- Stateful or interactive component: Mantine
- Fast theme-aware text color: Mantine `c` prop

## Routing Practices

- Keep routes file-based under `src/routes`.
- Put shared shell/layout in `src/App.tsx` and `src/routes/__root.tsx`.
- Prefer route params and nested routes over ad-hoc URL parsing.
- Do not edit `src/routeTree.gen.ts` manually.
- If routing types look stale, run `corepack pnpm routes:gen`.

## Database Practices

- Keep DB access in `src/lib/db`.
- Do not write SQL directly in route files.
- Keep migrations in `src-tauri/migrations`.
- Keep Tauri SQL permissions in sync with actual usage.
- If you need details, read `DB.md`.

## General Best Practices

- Prefer small, composable route components over one large page file.
- Keep Rust commands narrow and explicit. Validate inputs at the boundary.
- Keep app-wide providers, theme, and cross-cutting concerns out of page files.
- Do not duplicate state in both router and local component state unless there is a clear reason.
- Prefer explicit types on shared helpers, provider values, and Tauri command payloads.
- Avoid introducing a second component library unless there is a strong reason.
- Preserve the existing split: Tailwind for structure, Mantine for components.
- Keep generated files out of manual edits.

## Multi-Device Notes

- Prefer `corepack pnpm ...` in docs and scripts if a machine may not have global `pnpm` wired yet.
- If `tauri dev` or `tauri build` fails on a new machine, check OS-specific Tauri prerequisites first before changing app code.
- Prefer running `.\scripts\bootstrap.ps1` right after cloning this starter into a new app.
- If Node, Rust, or Tauri versions differ across devices, verify with:

```powershell
node -v
corepack pnpm -v
rustc -V
cargo -V
```

## Editing Rules

- Keep files ASCII unless there is a real need for Unicode.
- Avoid unnecessary comments.
- Prefer clear file names and predictable route names.
- When cloning this repo into a new app, update package name, product name, Tauri identifier, and app title before shipping.
- When adding a new screen, prefer:
  1. new file in `src/routes`
  2. route-specific UI in that file
  3. shared UI extracted only after a real second use case exists
