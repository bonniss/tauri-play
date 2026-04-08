import { BaseDirectory, mkdir, writeFile } from "@tauri-apps/plugin-fs"

const DEFAULT_CLASS_ID = "unclassified"

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",", 2)
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

export async function saveCapturedImage({
  classId = DEFAULT_CLASS_ID,
  dataUrl,
  projectId,
}: {
  classId?: string
  dataUrl: string
  projectId: string
}) {
  const sampleId = crypto.randomUUID()
  const directoryPath = `projects/${projectId}/samples/${classId}`
  const fileName = `${sampleId}.jpg`
  const filePath = `${directoryPath}/${fileName}`

  await mkdir(directoryPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  })

  await writeFile(filePath, dataUrlToBytes(dataUrl), {
    baseDir: BaseDirectory.AppData,
  })

  return {
    classId,
    fileName,
    filePath,
    projectId,
    sampleId,
  }
}
