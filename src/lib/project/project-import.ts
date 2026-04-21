import { invoke } from '@tauri-apps/api/core';
import { createClass } from '~/lib/db/domain/classes';
import { createProject } from '~/lib/db/domain/projects';
import { createSample } from '~/lib/db/domain/samples';
import { genClassId, genProjectId, genSampleId } from './id-generator';
import type { ExportManifest } from './project-export';

export async function importProject(file: File): Promise<string> {
  const zipBytes = Array.from(new Uint8Array(await file.arrayBuffer()));

  const manifestJson = await invoke<string>('get_import_manifest', { zipBytes });
  const manifest = JSON.parse(manifestJson) as ExportManifest;

  const newProjectId = genProjectId();

  // Build ID mappings
  const classIdMap = new Map<string, string>();
  for (const cls of manifest.classes) {
    classIdMap.set(cls.id, genClassId());
  }

  const sampleIdMap = new Map<string, string>();
  for (const sample of manifest.samples) {
    sampleIdMap.set(sample.id, genSampleId());
  }

  // path_map: "oldClassId/oldSampleId" -> "newClassId/newSampleId"
  const pathMap: Record<string, string> = {};
  for (const sample of manifest.samples) {
    const newClassId = classIdMap.get(sample.classId);
    const newSampleId = sampleIdMap.get(sample.id);
    if (newClassId && newSampleId) {
      pathMap[`${sample.classId}/${sample.id}`] = `${newClassId}/${newSampleId}`;
    }
  }

  await invoke('extract_import_samples', {
    zipBytes,
    newProjectId,
    pathMap,
  });

  await createProject({
    id: newProjectId,
    name: manifest.project.name,
    description: manifest.project.description,
    settings: manifest.project.settings,
    status: 'draft',
    taskType: manifest.project.taskType,
  });

  for (const cls of manifest.classes) {
    const newClassId = classIdMap.get(cls.id)!;
    await createClass({
      id: newClassId,
      projectId: newProjectId,
      name: cls.name,
      description: cls.description,
      order: cls.order,
    });
  }

  for (const sample of manifest.samples) {
    const newClassId = classIdMap.get(sample.classId)!;
    const newSampleId = sampleIdMap.get(sample.id)!;
    const ext = sample.fileName.split('.').pop() ?? 'jpg';
    const newFileName = `${newSampleId}.${ext}`;

    await createSample({
      id: newSampleId,
      projectId: newProjectId,
      classId: newClassId,
      fileName: newFileName,
      mimeType: sample.mimeType,
      source: sample.source as 'camera' | 'upload',
      order: sample.order,
    });
  }

  return newProjectId;
}
