import { convertFileSrc } from "@tauri-apps/api/core"
import { appDataDir, join } from "@tauri-apps/api/path"

export async function createSamplePreviewUrl(filePath: string) {
  const appDataPath = await appDataDir()
  const absoluteFilePath = await join(appDataPath, filePath)

  return convertFileSrc(absoluteFilePath)
}

export function revokeSamplePreviewUrl(_url: string) {}
