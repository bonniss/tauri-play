import { getKysely } from "../kysely"
import { genModelId, genTrainLogId } from "~/lib/project/id-generator"

export type ModelTrainLogStatus =
  | "started"
  | "completed"
  | "failed"
  | "cancelled"

export type ModelRecord = {
  id: string
  projectId: string
  artifactPath: string
  trainedAt: string
  accuracy: number | null
  validationAccuracy: number | null
  loss: number | null
  validationLoss: number | null
  settingsSnapshot: string | null
  datasetSnapshot: string | null
  createdAt: string
  updatedAt: string
}

export type ModelTrainLogEvent =
  | {
      at: string
      meta?: Record<string, string | number | boolean | null>
      message: string
      type: "phase"
    }
  | {
      at: string
      trainSamples: number
      type: "split"
      validationSamples: number
    }
  | {
      acc?: number
      at: string
      epoch: number
      loss: number
      type: "epoch"
      valAcc?: number
      valLoss?: number
    }

export type ModelTrainLogDatasetSnapshot = {
  classCount: number
  totalSamples: number
  trainSamples: number
  validationSamples: number
  samplesPerClass: Array<{
    classId: string
    className: string
    trainSampleIds: string[]
    totalSamples: number
    trainSamples: number
    validationSampleIds: string[]
    validationSamples: number
  }>
}

export type ModelTrainLogSummary = {
  accuracy: number | null
  durationMs: number | null
  endedAt: string
  loss: number | null
  validationAccuracy: number | null
  validationLoss: number | null
}

export type ModelTrainLogRecord = {
  id: string
  projectId: string
  modelId: string | null
  status: ModelTrainLogStatus
  startedAt: string
  endedAt: string | null
  settingsSnapshot: string
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  summary: ModelTrainLogSummary | null
  events: ModelTrainLogEvent[]
  createdAt: string
  updatedAt: string
}

type ModelRow = {
  id: string
  project_id: string
  artifact_path: string
  trained_at: string
  accuracy: number | null
  validation_accuracy: number | null
  loss: number | null
  validation_loss: number | null
  settings_snapshot: string | null
  dataset_snapshot: string | null
  created_at: string
  updated_at: string
}

type ModelTrainLogRow = {
  id: string
  project_id: string
  model_id: string | null
  status: ModelTrainLogStatus
  started_at: string
  ended_at: string | null
  settings_snapshot: string
  dataset_snapshot: string
  summary_json: string | null
  log_json: string
  created_at: string
  updated_at: string
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function mapModelRow(row: ModelRow): ModelRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    artifactPath: row.artifact_path,
    trainedAt: row.trained_at,
    accuracy: row.accuracy,
    validationAccuracy: row.validation_accuracy,
    loss: row.loss,
    validationLoss: row.validation_loss,
    settingsSnapshot: row.settings_snapshot,
    datasetSnapshot: row.dataset_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapModelTrainLogRow(row: ModelTrainLogRow): ModelTrainLogRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    modelId: row.model_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    settingsSnapshot: row.settings_snapshot,
    datasetSnapshot: parseJson<ModelTrainLogDatasetSnapshot>(
      row.dataset_snapshot,
      {
        classCount: 0,
        totalSamples: 0,
        trainSamples: 0,
        validationSamples: 0,
        samplesPerClass: [],
      },
    ),
    summary: parseJson<ModelTrainLogSummary | null>(row.summary_json, null),
    events: parseJson<ModelTrainLogEvent[]>(row.log_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getProjectModel(projectId: string) {
  const db = getKysely()
  const row = await db
    .selectFrom("models")
    .selectAll()
    .where("project_id", "=", projectId)
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return mapModelRow(row as ModelRow)
}

export async function upsertProjectModel({
  accuracy = null,
  artifactPath,
  datasetSnapshot = null,
  id,
  loss = null,
  projectId,
  settingsSnapshot = null,
  trainedAt = new Date().toISOString(),
  validationAccuracy = null,
  validationLoss = null,
}: {
  accuracy?: number | null
  artifactPath: string
  datasetSnapshot?: string | null
  id?: string
  loss?: number | null
  projectId: string
  settingsSnapshot?: string | null
  trainedAt?: string
  validationAccuracy?: number | null
  validationLoss?: number | null
}) {
  const db = getKysely()
  const now = new Date().toISOString()
  const existingModel = await db
    .selectFrom("models")
    .select(["id"])
    .where("project_id", "=", projectId)
    .executeTakeFirst()
  const modelId = id ?? existingModel?.id ?? genModelId()

  await db
    .insertInto("models")
    .values({
      id: modelId,
      project_id: projectId,
      artifact_path: artifactPath,
      trained_at: trainedAt,
      accuracy,
      validation_accuracy: validationAccuracy,
      loss,
      validation_loss: validationLoss,
      settings_snapshot: settingsSnapshot,
      dataset_snapshot: datasetSnapshot,
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc.column("project_id").doUpdateSet({
        artifact_path: artifactPath,
        trained_at: trainedAt,
        accuracy,
        validation_accuracy: validationAccuracy,
        loss,
        validation_loss: validationLoss,
        settings_snapshot: settingsSnapshot,
        dataset_snapshot: datasetSnapshot,
        updated_at: now,
      }),
    )
    .execute()

  return modelId
}

export async function createModelTrainLog({
  datasetSnapshot,
  events = [],
  id,
  projectId,
  settingsSnapshot,
  startedAt = new Date().toISOString(),
  status = "started",
  summary = null,
}: {
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  events?: ModelTrainLogEvent[]
  id?: string
  projectId: string
  settingsSnapshot: string
  startedAt?: string
  status?: ModelTrainLogStatus
  summary?: ModelTrainLogSummary | null
}) {
  const db = getKysely()
  const now = new Date().toISOString()
  const trainLogId = id ?? genTrainLogId()

  await db
    .insertInto("model_train_logs")
    .values({
      id: trainLogId,
      project_id: projectId,
      model_id: null,
      status,
      started_at: startedAt,
      ended_at: null,
      settings_snapshot: settingsSnapshot,
      dataset_snapshot: JSON.stringify(datasetSnapshot),
      summary_json: summary ? JSON.stringify(summary) : null,
      log_json: JSON.stringify(events),
      created_at: now,
      updated_at: now,
    })
    .execute()

  return trainLogId
}

export async function getModelTrainLog(trainLogId: string) {
  const db = getKysely()
  const row = await db
    .selectFrom("model_train_logs")
    .selectAll()
    .where("id", "=", trainLogId)
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return mapModelTrainLogRow(row as ModelTrainLogRow)
}

export async function getLatestProjectTrainLog(projectId: string) {
  const db = getKysely()
  const row = await db
    .selectFrom("model_train_logs")
    .selectAll()
    .where("project_id", "=", projectId)
    .orderBy("started_at", "desc")
    .executeTakeFirst()

  if (!row) {
    return null
  }

  return mapModelTrainLogRow(row as ModelTrainLogRow)
}

export async function listProjectTrainLogs(projectId: string) {
  const db = getKysely()
  const rows = await db
    .selectFrom("model_train_logs")
    .selectAll()
    .where("project_id", "=", projectId)
    .orderBy("started_at", "desc")
    .execute()

  return rows.map((row) => mapModelTrainLogRow(row as ModelTrainLogRow))
}

export async function appendModelTrainLogEvent(
  trainLogId: string,
  event: ModelTrainLogEvent,
) {
  const currentLog = await getModelTrainLog(trainLogId)

  if (!currentLog) {
    throw new Error("Train log not found.")
  }

  const events = [...currentLog.events, event]

  await getKysely()
    .updateTable("model_train_logs")
    .set({
      log_json: JSON.stringify(events),
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", trainLogId)
    .execute()

  return events
}

export async function updateModelTrainLogDatasetSnapshot({
  datasetSnapshot,
  trainLogId,
}: {
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  trainLogId: string
}) {
  await getKysely()
    .updateTable("model_train_logs")
    .set({
      dataset_snapshot: JSON.stringify(datasetSnapshot),
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", trainLogId)
    .execute()
}

export async function syncModelTrainLogProgress({
  datasetSnapshot,
  events,
  trainLogId,
}: {
  datasetSnapshot: ModelTrainLogDatasetSnapshot
  events: ModelTrainLogEvent[]
  trainLogId: string
}) {
  await getKysely()
    .updateTable("model_train_logs")
    .set({
      dataset_snapshot: JSON.stringify(datasetSnapshot),
      log_json: JSON.stringify(events),
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", trainLogId)
    .execute()
}

export async function updateModelTrainLogStatus({
  modelId,
  status,
  summary,
  trainLogId,
}: {
  modelId?: string | null
  status: Exclude<ModelTrainLogStatus, "started">
  summary?: ModelTrainLogSummary | null
  trainLogId: string
}) {
  await getKysely()
    .updateTable("model_train_logs")
    .set({
      model_id: modelId ?? null,
      status,
      ended_at: new Date().toISOString(),
      summary_json: summary ? JSON.stringify(summary) : null,
      updated_at: new Date().toISOString(),
    })
    .where("id", "=", trainLogId)
    .execute()
}
