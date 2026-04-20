import { Alert, Button, Code, Divider, Modal, Stack, Text } from "@mantine/core"
import { IconCircleCheck, IconDownload } from "@tabler/icons-react"
import { FunctionComponent, useState } from "react"
import { useAppProvider } from "~/components/layout/AppProvider"
import { exportModelAsZip } from "~/lib/ml/mobilenet/export"

const EMBED_SNIPPET = `<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js"></script>`

interface ExportModelModalProps {
  artifactPath: string
  projectName: string
  opened: boolean
  onClose: () => void
}

const ExportModelModal: FunctionComponent<ExportModelModalProps> = ({
  artifactPath,
  projectName,
  opened,
  onClose,
}) => {
  const { t } = useAppProvider()
  const [isExporting, setIsExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setExported(false)
      setError(null)
    }, 300)
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    try {
      const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_") || "model"
      await exportModelAsZip(artifactPath, safeName)
      setExported(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("project.train.export.title")}
      size="md"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text size="xs" fw={500} c="dimmed" tt="uppercase">
            {t("project.train.export.contentsTitle")}
          </Text>
          <Code block>{`index.html   ← open in browser or deploy\nmodel.json\nweights.bin\nmetadata.json`}</Code>
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Text size="xs" fw={500} c="dimmed" tt="uppercase">
            {t("project.train.export.deployTitle")}
          </Text>
          <Text size="sm">{t("project.train.export.deployNetlify")}</Text>
          <Text size="sm">{t("project.train.export.deployLocal")}</Text>
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Text size="xs" fw={500} c="dimmed" tt="uppercase">
            {t("project.train.export.embedTitle")}
          </Text>
          <Code block>{EMBED_SNIPPET}</Code>
          <Text size="xs" c="dimmed">
            {t("project.train.export.embedHint")}
          </Text>
        </Stack>

        {exported ? (
          <Alert
            color="teal"
            variant="light"
            icon={<IconCircleCheck className="size-4" />}
          >
            {t("project.train.export.successTitle")}
          </Alert>
        ) : null}

        {error ? (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="subtle" color="gray" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={<IconDownload className="size-4" />}
            loading={isExporting}
            onClick={() => void handleExport()}
          >
            {exported
              ? t("project.train.export.exportAgain")
              : t("common.export")}
          </Button>
        </div>
      </Stack>
    </Modal>
  )
}

export default ExportModelModal
