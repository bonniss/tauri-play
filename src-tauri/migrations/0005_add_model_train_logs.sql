ALTER TABLE models ADD COLUMN validation_accuracy REAL;
ALTER TABLE models ADD COLUMN loss REAL;
ALTER TABLE models ADD COLUMN validation_loss REAL;
ALTER TABLE models ADD COLUMN settings_snapshot TEXT;
ALTER TABLE models ADD COLUMN dataset_snapshot TEXT;

CREATE TABLE IF NOT EXISTS model_train_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    model_id TEXT,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    settings_snapshot TEXT NOT NULL,
    dataset_snapshot TEXT NOT NULL,
    summary_json TEXT,
    log_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
    CHECK (status IN ('started', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_model_train_logs_project_id
ON model_train_logs(project_id);

CREATE INDEX IF NOT EXISTS idx_model_train_logs_model_id
ON model_train_logs(model_id);

CREATE INDEX IF NOT EXISTS idx_model_train_logs_started_at
ON model_train_logs(started_at);
