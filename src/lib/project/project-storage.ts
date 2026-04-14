import { BaseDirectory, exists, remove } from "@tauri-apps/plugin-fs"

export async function deleteProjectStorage(projectId: string) {
  const projectDirectoryPath = `projects/${projectId}`
  const hasProjectDirectory = await exists(projectDirectoryPath, {
    baseDir: BaseDirectory.AppData,
  })

  if (!hasProjectDirectory) {
    return
  }

  await remove(projectDirectoryPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  })
}
