import { convertFileSrc } from "@tauri-apps/api/core"
import { appDataDir } from "@tauri-apps/api/path"

let appDataPathPromise: Promise<string> | null = null

async function getAppDataPath() {
  if (!appDataPathPromise) {
    appDataPathPromise = appDataDir()
  }

  return appDataPathPromise
}

export async function getSamplePreviewSrc(filePath: string) {
  const appDataPath = await getAppDataPath()
  const normalizedBasePath = appDataPath.replace(/[\\/]+$/, "")
  const normalizedFilePath = filePath.replace(/^[/\\]+/, "").replace(/\//g, "\\")

  return convertFileSrc(`${normalizedBasePath}\\${normalizedFilePath}`)
}
