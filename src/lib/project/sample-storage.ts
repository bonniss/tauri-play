import { BaseDirectory, exists, mkdir, remove, writeFile } from "@tauri-apps/plugin-fs"
import { CapturedFrame } from "~/components/camera/types"
import { genSampleId } from "./id-generator"

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

function inferExtensionFromMimeType(mimeType: string | null | undefined) {
  if (mimeType === "image/png") {
    return "png"
  }

  if (mimeType === "image/webp") {
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

async function readBlobImageDimensions(blob: Blob) {
  if (!blob.type.startsWith("image/")) {
    return {
      height: null,
      width: null,
    }
  }

  const objectUrl = URL.createObjectURL(blob)

  try {
    if ("createImageBitmap" in window) {
      const bitmap = await createImageBitmap(blob)
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

function dataUrlToBlob(dataUrl: string) {
  const [header = "", base64 = ""] = dataUrl.split(",", 2)
  const mimeMatch = header.match(/^data:(.*?);base64$/)
  const mimeType = mimeMatch?.[1] ?? "image/jpeg"
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

async function saveSampleBlob({
  blob,
  classId,
  extraMetadata = null,
  originalFileName = null,
  originalFilePath = null,
  lastModifiedAt = null,
  projectId,
  sampleId,
}: {
  blob: Blob
  classId: string
  extraMetadata?: string | null
  originalFileName?: string | null
  originalFilePath?: string | null
  lastModifiedAt?: string | null
  projectId: string
  sampleId: string
}) {
  const mimeType = blob.type || null
  const extension = originalFileName
    ? inferExtension({
        name: originalFileName,
        type: mimeType ?? "",
      } as File)
    : inferExtensionFromMimeType(mimeType)
  const directoryPath = `projects/${projectId}/samples/${classId}`
  const fileName = `${sampleId}.${extension}`
  const filePath = `${directoryPath}/${fileName}`
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const contentHash = await hashBytes(bytes)
  const dimensions = await readBlobImageDimensions(blob)

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
      mimeType,
      width: dimensions.width,
      height: dimensions.height,
      contentHash,
      fileSize: blob.size,
      lastModifiedAt,
      originalFileName,
      originalFilePath,
      extraMetadata,
    },
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
  return saveSampleBlob({
    blob: file,
    classId,
    lastModifiedAt: file.lastModified
      ? new Date(file.lastModified).toISOString()
      : null,
    originalFileName: file.name || null,
    originalFilePath:
      "webkitRelativePath" in file && file.webkitRelativePath
        ? file.webkitRelativePath
        : null,
    projectId,
    sampleId,
  })
}

export async function saveCapturedSampleFrames({
  classId,
  frames,
  projectId,
}: {
  classId: string
  frames: CapturedFrame[]
  projectId: string
}) {
  return Promise.all(
    frames.map(async (frame) => {
      const sampleId = genSampleId()
      const { filePath, metadata } = await saveSampleBlob({
        blob: dataUrlToBlob(frame.dataUrl),
        classId,
        lastModifiedAt: new Date(frame.capturedAt).toISOString(),
        projectId,
        sampleId,
      })

      return {
        id: sampleId,
        classId,
        createdAt: new Date(frame.capturedAt).toISOString(),
        extraMetadata: metadata.extraMetadata,
        filePath,
        fileSize: metadata.fileSize,
        height: metadata.height,
        lastModifiedAt: metadata.lastModifiedAt,
        mimeType: metadata.mimeType,
        originalFileName: metadata.originalFileName,
        originalFilePath: metadata.originalFilePath,
        source: "camera" as const,
        width: metadata.width,
        contentHash: metadata.contentHash,
      }
    }),
  )
}

export async function deleteSampleFile(filePath: string) {
  const hasSampleFile = await exists(filePath, {
    baseDir: BaseDirectory.AppData,
  })

  if (!hasSampleFile) {
    return
  }

  await remove(filePath, {
    baseDir: BaseDirectory.AppData,
  })
}
