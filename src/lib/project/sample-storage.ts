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

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")
}

async function hashBytes(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return bytesToHex(new Uint8Array(digest))
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
  const contentHash = await hashBytes(bytes)

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
    metadata: {
      contentHash,
      fileSize: file.size,
      lastModifiedAt: file.lastModified
        ? new Date(file.lastModified).toISOString()
        : null,
      originalFileName: file.name || null,
      originalFilePath:
        "webkitRelativePath" in file && file.webkitRelativePath
          ? file.webkitRelativePath
          : null,
    },
  }
}
