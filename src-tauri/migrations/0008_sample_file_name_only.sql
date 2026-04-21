WITH RECURSIVE split(id, path, rest) AS (
  SELECT id, file_path, file_path
  FROM samples

  UNION ALL

  SELECT
    id,
    path,
    substr(rest, instr(rest, '/') + 1)
  FROM split
  WHERE instr(rest, '/') > 0
),
final AS (
  SELECT id, rest AS fileName
  FROM split
  WHERE instr(rest, '/') = 0
)
UPDATE samples
SET file_path = (
  SELECT fileName FROM final WHERE final.id = samples.id
);
