import { invoke } from '@tauri-apps/api/core';
import { getProjectWorkspace } from '~/lib/db/domain/projects';

export interface ExportManifest {
  version: 1;
  project: {
    id: string;
    name: string;
    description: string | null;
    settings: string;
    status: string;
    taskType: string;
  };
  classes: Array<{
    id: string;
    name: string;
    description: string | null;
    order: number;
  }>;
  samples: Array<{
    id: string;
    classId: string;
    filePath: string;
    mimeType: string | null;
    source: string;
    order: number;
  }>;
}

export async function exportProject(projectId: string): Promise<string> {
  const workspace = await getProjectWorkspace(projectId);

  const manifest: ExportManifest = {
    version: 1,
    project: {
      id: workspace.project.id,
      name: workspace.project.name,
      description: workspace.project.description,
      settings: workspace.project.settings,
      status: workspace.project.status,
      taskType: workspace.project.taskType,
    },
    classes: workspace.classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      order: c.order,
    })),
    samples: workspace.samples.map((s) => ({
      id: s.id,
      classId: s.classId,
      filePath: s.filePath,
      mimeType: s.mimeType,
      source: s.source,
      order: s.order,
    })),
  };

  const zipPath = await invoke<string>('export_project', {
    projectId,
    projectName: workspace.project.name,
    manifestJson: JSON.stringify(manifest),
  });

  return zipPath;
}
