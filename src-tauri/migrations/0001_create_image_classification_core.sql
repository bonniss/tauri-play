CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    description TEXT,
    settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (task_type IN ('image_classification'))
);

CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS samples (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CHECK (source IN ('camera', 'upload'))
);

CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    artifact_path TEXT NOT NULL,
    trained_at TEXT NOT NULL,
    accuracy REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_classes_project_id
ON classes(project_id);

CREATE INDEX IF NOT EXISTS idx_samples_project_id
ON samples(project_id);

CREATE INDEX IF NOT EXISTS idx_samples_class_id
ON samples(class_id);

CREATE INDEX IF NOT EXISTS idx_models_project_id
ON models(project_id);
