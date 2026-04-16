import { getKysely } from '../kysely';

export type ProjectClass = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  order: number;
  sampleCount: number;
  createdAt: string;
  updatedAt?: string;
};

type ProjectClassRow = {
  created_at: string;
  description: string | null;
  id: string;
  name: string;
  project_id: string;
  order: number;
  sampleCount: number | string;
  updated_at?: string;
};

type ProjectClassSampleCountRow = {
  project_id: string;
  class_id: string;
  sampleCount: number | string;
};

function mapProjectClass(row: ProjectClassRow): ProjectClass {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    order: Number(row.order),
    sampleCount: Number(row.sampleCount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectClasses(projectId: string) {
  const db = getKysely();
  const rows = await db
    .selectFrom('classes as c')
    .leftJoin('samples as s', 's.class_id', 'c.id')
    .select(({ fn, ref }) => [
      'c.id',
      'c.project_id',
      'c.name',
      'c.description',
      'c.order',
      'c.created_at',
      'c.updated_at',
      fn.count<string>(ref('s.id')).as('sampleCount'),
    ])
    .where('c.project_id', '=', projectId)
    .groupBy([
      'c.id',
      'c.project_id',
      'c.name',
      'c.description',
      'c.order',
      'c.created_at',
      'c.updated_at',
    ])
    .orderBy('c.order', 'asc')
    .execute();

  return rows.map((row) => mapProjectClass(row as ProjectClassRow));
}

export async function listProjectClassSampleCounts(projectIds: string[]) {
  if (!projectIds.length) {
    return [];
  }

  const db = getKysely();
  const rows = await db
    .selectFrom('classes as c')
    .leftJoin('samples as s', 's.class_id', 'c.id')
    .select(({ fn, ref }) => [
      'c.project_id',
      'c.id as class_id',
      fn.count<string>(ref('s.id')).as('sampleCount'),
    ])
    .where('c.project_id', 'in', projectIds)
    .groupBy(['c.project_id', 'c.id'])
    .execute();

  return rows.map((row) => ({
    projectId: (row as ProjectClassSampleCountRow).project_id,
    classId: (row as ProjectClassSampleCountRow).class_id,
    sampleCount: Number((row as ProjectClassSampleCountRow).sampleCount),
  }));
}

export async function createClass({
  order,
  id,
  projectId,
  name,
  description = null,
}: {
  order?: number;
  id?: string;
  projectId: string;
  name: string;
  description?: string | null;
}) {
  const db = getKysely();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Class name is required.');
  }

  const nextOrder =
    order ??
    (await db
      .selectFrom('classes')
      .select(({ fn }) => [fn.max<number>('order').as('maxOrder')])
      .where('project_id', '=', projectId)
      .executeTakeFirst()
      .then((row) => Number(row?.maxOrder ?? -1) + 1));

  const nextClass = {
    id: id ?? crypto.randomUUID(),
    project_id: projectId,
    name: trimmedName,
    description,
    order: nextOrder,
  };

  await db.insertInto('classes').values(nextClass).execute();

  return nextClass.id;
}

export async function renameClass({
  classId,
  name,
  description,
}: {
  classId: string;
  name: string;
  description?: string | null;
}) {
  const db = getKysely();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error('Class name is required.');
  }

  const update: {
    description?: string | null;
    name: string;
    updated_at: string;
  } = {
    name: trimmedName,
    updated_at: new Date().toISOString(),
  };

  if (description !== undefined) {
    update.description = description;
  }

  await db
    .updateTable('classes')
    .set(update)
    .where('id', '=', classId)
    .execute();
}

export async function deleteClass(classId: string) {
  const db = getKysely();
  await db.deleteFrom('classes').where('id', '=', classId).execute();
}
