use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_url = "sqlite:app.db";
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_image_classification_core",
            sql: include_str!("../migrations/0001_create_image_classification_core.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_order_to_classes_and_samples",
            sql: include_str!("../migrations/0002_add_order_to_classes_and_samples.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_sample_metadata",
            sql: include_str!("../migrations/0003_add_sample_metadata.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add_sample_media_metadata",
            sql: include_str!("../migrations/0004_add_sample_media_metadata.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add_model_train_logs",
            sql: include_str!("../migrations/0005_add_model_train_logs.sql"),
            kind: MigrationKind::Up,
        },
    ];

    #[cfg(debug_assertions)]
    let log_level = log::LevelFilter::Debug;
    #[cfg(not(debug_assertions))]
    let log_level = log::LevelFilter::Info;

    let log_plugin = tauri_plugin_log::Builder::new()
        .level(log_level)
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::LogDir { file_name: None }),
            Target::new(TargetKind::Webview),
        ])
        .build();

    tauri::Builder::default()
        .plugin(log_plugin)
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db_url, migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
