import { BaseDirectory, mkdir, writeFile } from "@tauri-apps/plugin-fs"

function inferExtension(file: File) {
  const byName = file.name.split(".").pop()?.trim().toLowerCase()

  if (byName) {
    return byName
  }

  if (file.type === "image/png") {
    return "png"
  }

  if (file.type === "image/webp") {
    return "webp"
  }

  return "jpg"
}

export async function saveUploadedSampleFile({
  classId,
  file,
  projectId,
  sampleId,
}: {
  classId: string
  file: File
  projectId: string
  sampleId: string
}) {
  const extension = inferExtension(file)
  const directoryPath = `projects/${projectId}/samples/${classId}`
  const fileName = `${sampleId}.${extension}`
  const filePath = `${directoryPath}/${fileName}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  await mkdir(directoryPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  })

  await writeFile(filePath, bytes, {
    baseDir: BaseDirectory.AppData,
  })

  return {
    fileName,
    filePath,
  }
}
