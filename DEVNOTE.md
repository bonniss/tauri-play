# Tauri note

## Dev overview

You can open the Web Inspector to debug your application by performing a right-click on the webview and clicking “Inspect” or using the `Ctrl + Shift + I` shortcut on Windows and Linux or `Cmd + Option + I` shortcut on macOS.

## [Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/)

## [Calling the Frontend from Rust](https://v2.tauri.app/develop/calling-frontend/)

## [State management](https://v2.tauri.app/develop/state-management/)

## [Plugin system](https://v2.tauri.app/plugin/)

### [Store](https://v2.tauri.app/plugin/store/)

This plugin provides a persistent key-value store.

This store will allow you to persist state to a file which can be saved and loaded on demand including between app restarts. Note that this process is asynchronous which will require handling it within your code. It can be used both in the webview or within Rust.

### [OS info](https://v2.tauri.app/plugin/os-info/)

With this plugin you can query multiple information from current operational system. See all available functions in the [JavaScript API](https://v2.tauri.app/reference/javascript/os/) or [Rust API](https://docs.rs/tauri-plugin-os/) references.
