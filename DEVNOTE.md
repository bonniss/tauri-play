# Dev Note

## Branch Strategy

This repo currently uses two branches with different roles:

- `main`: template track
- `dev`: business app track

### `main`

`main` is kept generic and template-oriented.

It should only receive changes that are broadly reusable, such as:

- app shell improvements
- generic settings and system utilities
- reusable DX and tooling improvements
- routing, provider, or data-layer patterns that are still product-agnostic
- template-safe styling and layout improvements

It should not receive:

- business-specific routes
- domain models tied to the app
- product copy
- one-off workflows
- schema changes that only exist for business logic

### `dev`

`dev` is the working branch for the real business app.

This is where product-specific work happens first. If something turns out to be generic and mature enough for the starter, it can be cherry-picked back into `main`.

### Integration Rule

Do not merge `dev` back into `main`.

Instead:

1. build and validate work in `dev`
2. isolate generic changes into clean commits
3. cherry-pick only those commits into `main`

This keeps `main` clean and prevents business history from leaking into the template branch.

### Commit Discipline

When working in `dev`, always ask:

- is this change generic?
- or is it product-specific?

If a change is generic, keep it in a separate commit whenever possible. Cherry-picking only works well when commits are small and clearly scoped.

## Tauri Notes

### Web Inspector

You can open the Web Inspector by right-clicking the webview and choosing `Inspect`, or by using:

- `Ctrl + Shift + I` on Windows and Linux
- `Cmd + Option + I` on macOS

## Official References

- [Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/)
- [Calling the Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/)
- [State management](https://v2.tauri.app/develop/state-management/)
- [Plugin system](https://v2.tauri.app/plugin/)
- [Store plugin](https://v2.tauri.app/plugin/store/)
- [OS plugin](https://v2.tauri.app/plugin/os-info/)
- [Webview versions](https://v2.tauri.app/reference/webview-versions/)

## Webview Runtime

### Windows

Tauri uses WebView2, which is based on Microsoft Edge / Chromium.

### macOS and Linux

Tauri uses WebKit:

- `WKWebView` on macOS
- `webkit2gtk` on Linux

## Issues

### Gaining access to the camera and microphone after being blocked not working

[#5042](https://github.com/tauri-apps/tauri/issues/5042)

## Core Flow

### Create a Project

- From list page -> create new project/app
- UI create/edit page should align with that flow

## Label Image Grid Plan

- Split the thumbnail grid into a self-contained `ImageGrid` component that receives `samples` via props.
- `ImageGrid` should support Windows Explorer style a11y:
  - active item state
  - `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
  - `Home`, `End`
  - `Enter` or `Space` to open lightbox
  - `Escape` to close lightbox
  - when lightbox closes, restore focus to the active thumbnail
- Lightbox should support previous/next navigation via keyboard and UI controls.
- Lightbox should expose an image delete action, but actual delete logic stays in the parent via prop callback.
- Delete callback should receive the full `sample`, not just `id`.
- `ImageGrid` props should likely include:
  - `samples`
  - `activeSampleId?`
  - `defaultActiveSampleId?`
  - `onActiveSampleChange?`
  - `onDeleteSample?`
  - `getPreviewUrl?` or sample-level `previewUrl`
  - `emptyState?`
- Lightbox delete behavior:
  - after delete, move to next image or previous image
  - if the deleted image was the last one, close lightbox
- Open decisions to finalize later:
  - whether arrow key navigation wraps
  - whether delete in lightbox requires confirmation
  - whether duplicate upload should block, warn, or still allow upload

## Sample Metadata Plan

- Add metadata to `sample` for duplicate detection preparation:
  - `originalFileName?: string | null`
  - `originalFilePath?: string | null`
  - `fileSize?: number | null`
  - `lastModifiedAt?: string | null`
  - `contentHash?: string | null`
- If duplicate detection needs to be reliable, `contentHash` is the main signal.
- `originalFileName` and `originalFilePath` are mainly for source visibility and heuristics.

## Sample Media Metadata Decision

- Keep these sample fields as flat columns:
  - `mimeType`
  - `width`
  - `height`
  - `fileSize`
  - `contentHash`
  - `originalFileName`
  - `originalFilePath`
  - `lastModifiedAt`
- Keep experimental or loosely structured metadata in JSON:
  - `extraMetadata`
- Use flat columns for values that UI, filtering, validation, or dedup logic will read often.
- Use JSON for EXIF, device info, capture settings, import batch info, and other non-core metadata.
