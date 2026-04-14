import { Button, Modal, Select, Stack, Text, TextInput } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChangeEvent, FunctionComponent, useMemo, useRef, useState } from "react"
import { createClass } from "~/lib/db/domain/classes"
import { activateProject, updateProject } from "~/lib/db/domain/projects"
import { createSample } from "~/lib/db/domain/samples"
import { saveUploadedSampleFile } from "~/lib/project/sample-storage"
import { useProjectOne } from "./ProjectOneProvider"

interface UploadSamplesButtonProps {
  buttonLabel?: string
  classId?: string
}

const UploadSamplesButton: FunctionComponent<UploadSamplesButtonProps> = ({
  buttonLabel = "Upload",
  classId,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [opened, handlers] = useDisclosure(false)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    classId ?? null,
  )
  const [newClassName, setNewClassName] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { classes, projectId, projectStatus } = useProjectOne()
  const queryClient = useQueryClient()

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        label: item.name,
        value: item.id ?? "",
      })),
    [classes],
  )

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFiles.length) {
        throw new Error("Choose at least one image.")
      }

      const trimmedNewClassName = newClassName.trim()
      let targetClassId = selectedClassId

      if (trimmedNewClassName) {
        const existing = classes.find(
          (item) => item.name.toLowerCase() === trimmedNewClassName.toLowerCase(),
        )

        targetClassId =
          existing?.id ??
          (await createClass({
            projectId,
            name: trimmedNewClassName,
          }))
      }

      if (!targetClassId) {
        throw new Error("Choose an existing class or enter a new class name.")
      }

      for (const file of selectedFiles) {
        const sampleId = crypto.randomUUID()
        const { filePath } = await saveUploadedSampleFile({
          classId: targetClassId,
          file,
          projectId,
          sampleId,
        })

        await createSample({
          id: sampleId,
          projectId,
          classId: targetClassId,
          filePath,
          source: "upload",
        })
      }

      if (projectStatus === "draft") {
        await activateProject(projectId)
      } else {
        await updateProject({
          projectId,
        })
      }

      return targetClassId
    },
    onSuccess: async (targetClassId) => {
      handlers.close()
      setSelectedFiles([])
      setNewClassName("")
      setSelectedClassId(targetClassId)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ])
    },
  })

  function handleSelectFiles(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])

    if (!nextFiles.length) {
      return
    }

    setSelectedFiles(nextFiles)
    setSelectedClassId(classId ?? null)
    setNewClassName("")
    handlers.open()
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

      <Button
        onClick={() => {
          fileInputRef.current?.click()
        }}
        variant="light"
      >
        {buttonLabel}
      </Button>

      <Modal
        onClose={handlers.close}
        opened={opened}
        title={`Upload ${selectedFiles.length || ""} image${selectedFiles.length === 1 ? "" : "s"}`.trim()}
      >
        <Stack>
          <Text c="dimmed" size="sm">
            {classes.length
              ? "Choose an existing class or enter a new class name."
              : "Enter a class name for these images."}
          </Text>

          {classes.length ? (
            <Select
              data={classOptions}
              label="Existing class"
              onChange={(value) => setSelectedClassId(value ? String(value) : null)}
              placeholder="Choose a class"
              value={selectedClassId}
            />
          ) : null}

          <TextInput
            autoFocus={classes.length === 0}
            label={classes.length ? "New class name" : "Class name"}
            onChange={(event) => setNewClassName(event.currentTarget.value)}
            placeholder="e.g. Drinking"
            value={newClassName}
          />

          <div className="flex justify-end gap-3">
            <Button onClick={handlers.close} type="button" variant="default">
              Cancel
            </Button>
            <Button loading={uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>
              Save Images
            </Button>
          </div>

          {uploadMutation.error ? (
            <Text c="red.6" size="sm">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Upload failed."}
            </Text>
          ) : null}
        </Stack>
      </Modal>
    </>
  )
}

export default UploadSamplesButton
