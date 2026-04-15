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

async function readImageDimensions(file: File) {
  if (!file.type.startsWith("image/")) {
    return {
      height: null,
      width: null,
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(file)
      const dimensions = {
        height: bitmap.height,
        width: bitmap.width,
      }

      bitmap.close()

      return dimensions
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image()

      nextImage.onload = () => resolve(nextImage)
      nextImage.onerror = () =>
        reject(new Error("Failed to read image dimensions."))
      nextImage.src = objectUrl
    })

    return {
      height: image.naturalHeight,
      width: image.naturalWidth,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
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
  const dimensions = await readImageDimensions(file)

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
      mimeType: file.type || null,
      width: dimensions.width,
      height: dimensions.height,
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
      extraMetadata: null,
    },
  }
}
