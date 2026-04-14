import { getKysely } from "../kysely"

export type SampleSource = "camera" | "upload"

export type ProjectSample = {
  id: string
  projectId: string
  classId: string
  filePath: string
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
    filePath: row.file_path,
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
  order,
  id,
  projectId,
  classId,
  filePath,
  source,
}: {
  order?: number
  id?: string
  projectId: string
  classId: string
  filePath: string
  source: SampleSource
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
    file_path: filePath,
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

export async function deleteSample(sampleId: string) {
  const db = getKysely()
  await db.deleteFrom("samples").where("id", "=", sampleId).execute()
}
