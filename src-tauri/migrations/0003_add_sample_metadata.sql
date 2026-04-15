ALTER TABLE samples
ADD COLUMN original_file_name TEXT;

ALTER TABLE samples
ADD COLUMN original_file_path TEXT;

ALTER TABLE samples
ADD COLUMN file_size INTEGER;

ALTER TABLE samples
ADD COLUMN last_modified_at TEXT;

ALTER TABLE samples
ADD COLUMN content_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_samples_content_hash
ON samples(content_hash);
