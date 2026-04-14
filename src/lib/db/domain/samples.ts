import { getKysely } from "../kysely"

export type SampleSource = "camera" | "upload"

export type ProjectSample = {
  id: string
  projectId: string
  classId: string
  filePath: string
  source: SampleSource
  className: string | null
  createdAt: string
}

type ProjectSampleRow = {
  class_id: string
  class_name: string | null
  created_at: string
  file_path: string
  id: string
  project_id: string
  source: SampleSource
}

function mapProjectSample(row: ProjectSampleRow): ProjectSample {
  return {
    id: row.id,
    projectId: row.project_id,
    classId: row.class_id,
    filePath: row.file_path,
    source: row.source,
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
      "s.source",
      "s.created_at",
      "c.name as class_name",
    ])
    .where("s.project_id", "=", projectId)
    .orderBy("s.created_at", "desc")
    .execute()

  return rows.map((row) => mapProjectSample(row as ProjectSampleRow))
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
      "s.source",
      "s.created_at",
      "c.name as class_name",
    ])
    .where("s.class_id", "=", classId)
    .orderBy("s.created_at", "desc")
    .execute()

  return rows.map((row) => mapProjectSample(row as ProjectSampleRow))
}

export async function createSample({
  id,
  projectId,
  classId,
  filePath,
  source,
}: {
  id?: string
  projectId: string
  classId: string
  filePath: string
  source: SampleSource
}) {
  const db = getKysely()
  const nextSample = {
    id: id ?? crypto.randomUUID(),
    project_id: projectId,
    class_id: classId,
    file_path: filePath,
    source,
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
  await db
    .updateTable("samples")
    .set({
      class_id: classId,
    })
    .where("id", "=", sampleId)
    .execute()
}

export async function deleteSample(sampleId: string) {
  const db = getKysely()
  await db.deleteFrom("samples").where("id", "=", sampleId).execute()
}
