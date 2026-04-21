import { getKysely } from "../kysely"

export type SampleSource = "camera" | "upload"

export type ProjectSamplePreview = {
  id: string
  projectId: string
  classId: string
  fileName: string
}

export type ProjectSample = {
  id: string
  projectId: string
  classId: string
  fileName: string
  mimeType: string | null
  width: number | null
  height: number | null
  originalFileName: string | null
  originalFilePath: string | null
  fileSize: number | null
  lastModifiedAt: string | null
  contentHash: string | null
  extraMetadata: string | null
  source: SampleSource
  order: number
  className: string | null
  createdAt: string
}

type ProjectSampleRow = {
  class_id: string
  class_name: string | null
  created_at: string
  file_path: string
  mime_type: string | null
  width: number | null
  height: number | null
  original_file_name: string | null
  original_file_path: string | null
  file_size: number | null
  last_modified_at: string | null
  content_hash: string | null
  extra_metadata: string | null
  id: string
  order: number
  project_id: string
  source: SampleSource
}

function mapProjectSample(row: ProjectSampleRow): ProjectSample {
  return {
    id: row.id,
    projectId: row.project_id,
    classId: row.class_id,
    fileName: row.file_path,
    mimeType: row.mime_type,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    originalFileName: row.original_file_name,
    originalFilePath: row.original_file_path,
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    lastModifiedAt: row.last_modified_at,
    contentHash: row.content_hash,
    extraMetadata: row.extra_metadata,
    source: row.source,
    order: Number(row.order),
    className: row.class_name,
    createdAt: row.created_at,
  }
}

export async function listProjectSamples(projectId: string) {
  const db = getKysely()
  const rows = await db
    .selectFrom("samples as s")
    .innerJoin("classes as c", "c.id", "s.class_id")
    .select([
      "s.id",
      "s.project_id",
      "s.class_id",
      "s.file_path",
      "s.mime_type",
      "s.width",
      "s.height",
      "s.original_file_name",
      "s.original_file_path",
      "s.file_size",
      "s.last_modified_at",
      "s.content_hash",
      "s.extra_metadata",
      "s.source",
      "s.order",
      "s.created_at",
      "c.name as class_name",
    ])
    .where("s.project_id", "=", projectId)
    .orderBy("c.order", "asc")
    .orderBy("s.order", "asc")
    .orderBy("s.created_at", "asc")
    .execute()

  return rows.map((row) => mapProjectSample(row as ProjectSampleRow))
}

export async function listProjectSamplePreviews(projectIds: string[]) {
  if (!projectIds.length) {
    return []
  }

  const db = getKysely()
  const rows = await db
    .selectFrom("samples")
    .select(["id", "project_id", "class_id", "file_path"])
    .where("project_id", "in", projectIds)
    .orderBy("order", "asc")
    .orderBy("created_at", "asc")
    .execute()

  const previewMap = new Map<string, ProjectSamplePreview[]>()

  rows.forEach((row) => {
    const list = previewMap.get(row.project_id) ?? []

    if (list.length >= 5) {
      if (!previewMap.has(row.project_id)) {
        previewMap.set(row.project_id, list)
      }

      return
    }

    list.push({
      id: row.id,
      projectId: row.project_id,
      classId: row.class_id,
      fileName: row.file_path,
    })
    previewMap.set(row.project_id, list)
  })

  return Array.from(previewMap.values()).flat()
}

export async function listClassSamples(classId: string) {
  const db = getKysely()
  const rows = await db
    .selectFrom("samples as s")
    .innerJoin("classes as c", "c.id", "s.class_id")
    .select([
      "s.id",
      "s.project_id",
      "s.class_id",
      "s.file_path",
      "s.mime_type",
      "s.width",
      "s.height",
      "s.original_file_name",
      "s.original_file_path",
      "s.file_size",
      "s.last_modified_at",
      "s.content_hash",
      "s.extra_metadata",
      "s.source",
      "s.order",
      "s.created_at",
      "c.name as class_name",
    ])
    .where("s.class_id", "=", classId)
    .orderBy("s.order", "asc")
    .orderBy("s.created_at", "asc")
    .execute()

  return rows.map((row) => mapProjectSample(row as ProjectSampleRow))
}

export async function createSample({
  id,
  projectId,
  classId,
  fileName,
  mimeType,
  width,
  height,
  originalFileName,
  originalFilePath,
  fileSize,
  lastModifiedAt,
  contentHash,
  extraMetadata,
  source,
  order,
}: {
  id?: string
  projectId: string
  classId: string
  fileName: string
  mimeType?: string | null
  width?: number | null
  height?: number | null
  originalFileName?: string | null
  originalFilePath?: string | null
  fileSize?: number | null
  lastModifiedAt?: string | null
  contentHash?: string | null
  extraMetadata?: string | null
  source: SampleSource
  order?: number
}) {
  const db = getKysely()
  const nextOrder =
    order ??
    (await db
      .selectFrom("samples")
      .select(({ fn }) => [fn.max<number>("order").as("maxOrder")])
      .where("class_id", "=", classId)
      .executeTakeFirst()
      .then((row) => Number(row?.maxOrder ?? -1) + 1))

  const nextSample = {
    id: id ?? crypto.randomUUID(),
    project_id: projectId,
    class_id: classId,
    file_path: fileName,
    mime_type: mimeType ?? null,
    width: width ?? null,
    height: height ?? null,
    original_file_name: originalFileName ?? null,
    original_file_path: originalFilePath ?? null,
    file_size: fileSize ?? null,
    last_modified_at: lastModifiedAt ?? null,
    content_hash: contentHash ?? null,
    extra_metadata: extraMetadata ?? null,
    source,
    order: nextOrder,
  }

  await db.insertInto("samples").values(nextSample).execute()

  return nextSample.id
}

export async function moveSampleToClass({
  sampleId,
  classId,
}: {
  sampleId: string
  classId: string
}) {
  const db = getKysely()
  const nextOrder = await db
    .selectFrom("samples")
    .select(({ fn }) => [fn.max<number>("order").as("maxOrder")])
    .where("class_id", "=", classId)
    .executeTakeFirst()
    .then((row) => Number(row?.maxOrder ?? -1) + 1)

  await db
    .updateTable("samples")
    .set({
      class_id: classId,
      order: nextOrder,
    })
    .where("id", "=", sampleId)
    .execute()
}

export async function reorderClassSamples(
  classId: string,
  orderedIds: string[],
) {
  const db = getKysely()
  await db.transaction().execute(async (trx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await trx
        .updateTable("samples")
        .set({ order: i })
        .where("id", "=", orderedIds[i]!)
        .where("class_id", "=", classId)
        .execute()
    }
  })
}

export async function deleteSample(sampleId: string) {
  const db = getKysely()
  await db.deleteFrom("samples").where("id", "=", sampleId).execute()
}
