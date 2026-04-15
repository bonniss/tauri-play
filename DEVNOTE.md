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

## Core flow

### Create a project

- From list page -> Create new project/app (suggest me)
- UI create/edit page will match

## Label Image Grid Plan

- Tách thumbnail grid thành một component `ImageGrid` tự chứa, nhận `samples` qua props.
- `ImageGrid` cần a11y kiểu Windows Explorer:
  - có active item
  - hỗ trợ `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
  - hỗ trợ `Home`, `End`
  - `Enter` hoặc `Space` để mở lightbox
  - `Escape` để đóng lightbox
  - đóng lightbox xong trả focus về thumbnail đang active
- Lightbox phải điều hướng được ảnh trước/sau bằng keyboard và UI control.
- Lightbox có nút xóa ảnh, nhưng logic xóa do trang cha quyết định qua prop callback để giữ single responsibility.
- Callback xóa nên nhận đầy đủ `sample`, không chỉ `id`.
- Thumbnail grid nên nhận thêm các prop dạng:
  - `samples`
  - `activeSampleId?`
  - `defaultActiveSampleId?`
  - `onActiveSampleChange?`
  - `onDeleteSample?`
  - `getPreviewUrl?` hoặc sample đã có sẵn `previewUrl`
  - `emptyState?`
- Hành vi xóa trong lightbox:
  - xóa xong tự nhảy sang ảnh kế hoặc ảnh trước
  - nếu xóa ảnh cuối cùng thì đóng lightbox
- Cần chốt thêm sau:
  - arrow key trong grid có wrap hay không
  - xóa trong lightbox có confirm hay không
  - upload trùng thì block, warn, hay vẫn cho upload

## Sample Metadata Plan

- Bổ sung metadata trên `sample` để chuẩn bị detect upload trùng:
  - `originalFileName?: string | null`
  - `originalFilePath?: string | null`
  - `fileSize?: number | null`
  - `lastModifiedAt?: string | null`
  - `contentHash?: string | null`
- Nếu cần detect trùng ổn định, `contentHash` là tín hiệu chính.
- `originalFileName` và `originalFilePath` chủ yếu để hiển thị nguồn gốc và hỗ trợ heuristic.

