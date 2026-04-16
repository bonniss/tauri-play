import { createProvider } from "react-easy-provider"
import { useState } from "react"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"

export const [useProjectPlay, ProjectPlayProvider] = createProvider(() => {
  const {
    applyPlaySettings,
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    playSettings,
  } = useProjectOne()
  const [settingsOpened, setSettingsOpened] = useState(false)

  async function submitPlaySettings(values: ProjectPlaySettingsFormValues) {
    await applyPlaySettings(values)
    setSettingsOpened(false)
  }

  return {
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    playSettings,
    setSettingsOpened,
    settingsOpened,
    submitPlaySettings,
  }
})
