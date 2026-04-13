import { getKysely } from "../kysely"
import { listProjectClasses, type ProjectClass } from "./classes"
import { listProjectSamples, type ProjectSample } from "./samples"

export type ProjectStatus = "draft" | "active" | "archived"

export type ProjectListItem = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  taskType: string
  classCount: number
  sampleCount: number
  hasModel: boolean
  updatedAt: string
}

export type ProjectRecord = {
  id: string
  name: string
  description: string | null
  settings: string
  status: ProjectStatus
  taskType: string
  createdAt: string
  updatedAt: string
}

export type ProjectWorkspace = {
  classes: ProjectClass[]
  project: ProjectRecord
  samples: ProjectSample[]
}

type ProjectListRow = {
  classCount: number | string
  description: string | null
  hasModel: number
  id: string
  name: string
  sampleCount: number | string
  status: ProjectStatus
  task_type: string
  updated_at: string
}

type ProjectRow = {
  created_at: string
  description: string | null
  id: string
  name: string
  settings: string
  status: ProjectStatus
  task_type: string
  updated_at: string
}

function mapProjectRow(row: ProjectListRow): ProjectListItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    taskType: row.task_type,
    classCount: Number(row.classCount),
    sampleCount: Number(row.sampleCount),
    hasModel: row.hasModel > 0,
    updatedAt: row.updated_at,
  }
}

function mapProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    settings: row.settings,
    status: row.status,
    taskType: row.task_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listProjects({
  includeArchived = false,
  search = "",
}: {
  includeArchived?: boolean
  search?: string
} = {}) {
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
      "p.status",
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
      "p.status",
      "p.description",
      "p.task_type",
      "p.updated_at",
    ])
    .orderBy("p.updated_at", "desc")

  if (!includeArchived) {
    query = query.where("p.status", "!=", "archived")
  }

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

export async function getProject(projectId: string) {
  const db = getKysely()
  const row = await db
    .selectFrom("projects")
    .select([
      "id",
      "name",
      "description",
      "settings",
      "status",
      "task_type",
      "created_at",
      "updated_at",
    ])
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!row) {
    throw new Error("Project not found.")
  }

  return mapProjectRecord(row as ProjectRow)
}

export async function getProjectWorkspace(projectId: string): Promise<ProjectWorkspace> {
  const [project, classes, samples] = await Promise.all([
    getProject(projectId),
    listProjectClasses(projectId),
    listProjectSamples(projectId),
  ])

  return {
    project,
    classes,
    samples,
  }
}

export async function createProject({
  description = null,
  id,
  name,
  settings = "{}",
  status = "draft",
  taskType = "image_classification",
}: {
  description?: string | null
  id?: string
  name: string
  settings?: string
  status?: ProjectStatus
  taskType?: string
}) {
  const db = getKysely()
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error("Project name is required.")
  }

  const projectId = id ?? crypto.randomUUID()

  await db
    .insertInto("projects")
    .values({
      id: projectId,
      name: trimmedName,
      status,
      task_type: taskType,
      description,
      settings,
    })
    .execute()

  return projectId
}

export async function updateProject({
  description,
  name,
  projectId,
  settings,
  status,
}: {
  description?: string | null
  name?: string
  projectId: string
  settings?: string
  status?: ProjectStatus
}) {
  const db = getKysely()
  const update: {
    description?: string | null
    name?: string
    settings?: string
    status?: ProjectStatus
    updated_at: string
  } = {
    updated_at: new Date().toISOString(),
  }

  if (name !== undefined) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new Error("Project name is required.")
    }

    update.name = trimmedName
  }

  if (description !== undefined) {
    update.description = description
  }

  if (settings !== undefined) {
    update.settings = settings
  }

  if (status !== undefined) {
    update.status = status
  }

  await db.updateTable("projects").set(update).where("id", "=", projectId).execute()
}

export async function archiveProject(projectId: string) {
  await updateProject({
    projectId,
    status: "archived",
  })
}

export async function activateProject(projectId: string) {
  await updateProject({
    projectId,
    status: "active",
  })
}
