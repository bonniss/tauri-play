import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs"

function inferMimeType(filePath: string) {
  const extension = filePath.split(".").pop()?.trim().toLowerCase()

  switch (extension) {
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    case "gif":
      return "image/gif"
    default:
      return "image/jpeg"
  }
}

export async function createSamplePreviewUrl(filePath: string) {
  const bytes = await readFile(filePath, {
    baseDir: BaseDirectory.AppData,
  })

  const blob = new Blob([bytes], {
    type: inferMimeType(filePath),
  })

  return URL.createObjectURL(blob)
}

export function revokeSamplePreviewUrl(url: string) {
  URL.revokeObjectURL(url)
}
