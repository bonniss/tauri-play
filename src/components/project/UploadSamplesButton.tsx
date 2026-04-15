import { type ButtonProps } from "@mantine/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChangeEvent, FunctionComponent, useRef } from "react"
import { createClass } from "~/lib/db/domain/classes"
import { activateProject, updateProject } from "~/lib/db/domain/projects"
import { createSample } from "~/lib/db/domain/samples"
import { genSampleId } from "~/lib/project/id-generator"
import { saveUploadedSampleFile } from "~/lib/project/sample-storage"
import ProjectActionButton from "./ProjectActionButton"
import { useProjectOne } from "./ProjectOneProvider"

interface UploadSamplesButtonProps {
  buttonLabel?: string
  classId?: string
  className?: string
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
}

type UploadTargetClass =
  | {
      id: string
      createdNow: false
    }
  | {
      id: string
      name: string
      order: number
      createdNow: true
    }

const UploadSamplesButton: FunctionComponent<UploadSamplesButtonProps> = ({
  buttonLabel = "Upload",
  className,
  classId,
  size,
  variant = "light",
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()
  const {
    projectId,
    projectStatus,
    seedClass,
    removeClass,
    addSamplesToClass,
    removeSamplesFromClass,
    setProjectStatus,
  } = useProjectOne()

  const uploadMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      if (!selectedFiles.length) {
        throw new Error("Choose at least one image.")
      }

      const seededClass: UploadTargetClass =
        classId != null
          ? { id: classId, createdNow: false }
          : (() => {
              const nextClass = seedClass()

              return {
                id: nextClass.id,
                name: nextClass.name,
                order: nextClass.order,
                createdNow: true,
              }
            })()

      const optimisticSamples = addSamplesToClass(
        seededClass.id,
        await Promise.all(
          selectedFiles.map(async (file) => {
            const sampleId = genSampleId()
            const { filePath, metadata } = await saveUploadedSampleFile({
              classId: seededClass.id,
              file,
              projectId,
              sampleId,
            })

            return {
              id: sampleId,
              classId: seededClass.id,
              filePath,
              mimeType: metadata.mimeType,
              width: metadata.width,
              height: metadata.height,
              originalFileName: metadata.originalFileName,
              originalFilePath: metadata.originalFilePath,
              fileSize: metadata.fileSize,
              lastModifiedAt: metadata.lastModifiedAt,
              contentHash: metadata.contentHash,
              extraMetadata: metadata.extraMetadata,
              source: "upload" as const,
            }
          }),
        ),
      )

      try {
        if (seededClass.createdNow) {
          await createClass({
            id: seededClass.id,
            projectId,
            name: seededClass.name,
            order: seededClass.order,
          })
        }

        await Promise.all(
          optimisticSamples.map((sample) =>
            createSample({
              id: sample.id,
              projectId,
              classId: sample.classId,
              filePath: sample.filePath,
              mimeType: sample.mimeType,
              width: sample.width,
              height: sample.height,
              originalFileName: sample.originalFileName,
              originalFilePath: sample.originalFilePath,
              fileSize: sample.fileSize,
              lastModifiedAt: sample.lastModifiedAt,
              contentHash: sample.contentHash,
              extraMetadata: sample.extraMetadata,
              source: sample.source,
              order: sample.order,
            }),
          ),
        )

        if (projectStatus === "draft") {
          setProjectStatus("active")
          await activateProject(projectId)
        } else {
          await updateProject({
            projectId,
          })
        }
      } catch (error) {
        removeSamplesFromClass(
          seededClass.id,
          optimisticSamples.map((sample) => sample.id),
        )

        if (seededClass.createdNow) {
          removeClass(seededClass.id)
        }

        throw error
      }
    },
    onSettled: async () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      await queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])

    if (!nextFiles.length) {
      return
    }

    uploadMutation.mutate(nextFiles)
  }

  return (
    <>
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={handleSelectFiles}
        ref={fileInputRef}
        type="file"
      />

      <ProjectActionButton
        action="upload"
        className={className}
        loading={uploadMutation.isPending}
        onClick={() => {
          fileInputRef.current?.click()
        }}
        size={size}
        variant={variant}
      >
        {buttonLabel}
      </ProjectActionButton>
    </>
  )
}

export default UploadSamplesButton
