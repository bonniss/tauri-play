use std::collections::HashMap;
use std::io::{Read, Write};
use std::fs;
use tauri::Manager;
use zip::write::SimpleFileOptions;
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn export_project(
    app: tauri::AppHandle,
    project_id: String,
    project_name: String,
    manifest_json: String,
) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let download_dir = app.path().download_dir().map_err(|e| e.to_string())?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let safe_name: String = project_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let zip_filename = format!("{}_{}.zip", safe_name.trim_matches('_'), timestamp);
    let zip_path = download_dir.join(&zip_filename);

    let zip_file = fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(zip_file);
    let options = SimpleFileOptions::default();

    zip.start_file("manifest.json", options).map_err(|e| e.to_string())?;
    zip.write_all(manifest_json.as_bytes()).map_err(|e| e.to_string())?;

    let samples_dir = app_data_dir.join("projects").join(&project_id).join("samples");
    if samples_dir.exists() {
        add_dir_to_zip(&mut zip, &samples_dir, &samples_dir, options)?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(zip_path.to_string_lossy().to_string())
}

fn add_dir_to_zip(
    zip: &mut zip::ZipWriter<fs::File>,
    base_dir: &std::path::Path,
    current_dir: &std::path::Path,
    options: SimpleFileOptions,
) -> Result<(), String> {
    for entry in fs::read_dir(current_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let relative = path.strip_prefix(base_dir).map_err(|e| e.to_string())?;
        let zip_path = format!("samples/{}", relative.to_string_lossy().replace('\\', "/"));

        if path.is_dir() {
            add_dir_to_zip(zip, base_dir, &path, options)?;
        } else {
            zip.start_file(&zip_path, options).map_err(|e| e.to_string())?;
            let mut buf = Vec::new();
            fs::File::open(&path)
                .map_err(|e| e.to_string())?
                .read_to_end(&mut buf)
                .map_err(|e| e.to_string())?;
            zip.write_all(&buf).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn get_import_manifest(zip_bytes: Vec<u8>) -> Result<String, String> {
    let cursor = std::io::Cursor::new(zip_bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    let mut manifest_file = archive.by_name("manifest.json").map_err(|e| e.to_string())?;
    let mut contents = String::new();
    manifest_file.read_to_string(&mut contents).map_err(|e| e.to_string())?;
    Ok(contents)
}

/// path_map: keys are "classId/sampleId" from the ZIP, values are "newClassId/newSampleId"
#[tauri::command]
async fn extract_import_samples(
    app: tauri::AppHandle,
    zip_bytes: Vec<u8>,
    new_project_id: String,
    path_map: HashMap<String, String>,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let cursor = std::io::Cursor::new(zip_bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut zip_file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = zip_file.name().to_string();

        if !name.starts_with("samples/") || name.ends_with('/') {
            continue;
        }

        // name = "samples/classId/sampleId.ext"
        let rel = &name["samples/".len()..];
        let ext = std::path::Path::new(rel)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        let stem = if ext.is_empty() {
            rel.to_string()
        } else {
            rel[..rel.len() - ext.len() - 1].to_string()
        };

        if let Some(new_stem) = path_map.get(&stem) {
            let target = app_data_dir
                .join("projects")
                .join(&new_project_id)
                .join("samples")
                .join(if ext.is_empty() {
                    new_stem.clone()
                } else {
                    format!("{}.{}", new_stem, ext)
                });

            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            let mut buf = Vec::new();
            zip_file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            fs::write(&target, &buf).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
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
        .invoke_handler(tauri::generate_handler![greet, export_project, get_import_manifest, extract_import_samples])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
