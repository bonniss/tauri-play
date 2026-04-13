import { getKysely } from "./kysely"

export type ProjectListItem = {
  id: string
  name: string
  description: string | null
  taskType: string
  classCount: number
  sampleCount: number
  hasModel: boolean
  updatedAt: string
}

type ProjectListRow = {
  classCount: number | string
  description: string | null
  hasModel: number
  id: string
  name: string
  sampleCount: number | string
  task_type: string
  updated_at: string
}

function mapProjectRow(row: ProjectListRow): ProjectListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    taskType: row.task_type,
    classCount: Number(row.classCount),
    sampleCount: Number(row.sampleCount),
    hasModel: row.hasModel > 0,
    updatedAt: row.updated_at,
  }
}

export async function listProjects(search = "") {
  const db = getKysely()
  const normalizedSearch = search.trim().toLowerCase()

  let query = db
    .selectFrom("projects as p")
    .leftJoin("classes as c", "c.project_id", "p.id")
    .leftJoin("samples as s", "s.project_id", "p.id")
    .leftJoin("models as m", "m.project_id", "p.id")
    .select(({ fn, ref }) => [
      "p.id",
      "p.name",
      "p.description",
      "p.task_type",
      "p.updated_at",
      fn.count<string>(ref("c.id")).distinct().as("classCount"),
      fn.count<string>(ref("s.id")).distinct().as("sampleCount"),
      fn.max<number>(ref("m.id")).as("hasModel"),
    ])
    .groupBy([
      "p.id",
      "p.name",
      "p.description",
      "p.task_type",
      "p.updated_at",
    ])
    .orderBy("p.updated_at", "desc")

  if (normalizedSearch) {
    query = query.where(({ fn, ref }) =>
      fn("lower", [ref("p.name")]),
      "like",
      `%${normalizedSearch}%`,
    )
  }

  const rows = await query.execute()

  return rows.map((row) => mapProjectRow(row as ProjectListRow))
}
