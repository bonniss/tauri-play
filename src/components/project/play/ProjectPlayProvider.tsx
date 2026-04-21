import { createProvider } from "react-easy-provider"
import { useMemo, useState } from "react"
import { useProjectOne } from "~/components/project/ProjectOneProvider"
import {
  type ProjectPlayLaunchMode,
  resolveLaunchPlayMode,
} from "~/lib/project/play-mode"
import { ProjectPlaySettingsFormValues } from "~/lib/project/settings"
import { projectPlaySettingsToFormValues } from "~/lib/project/settings"

export const [useProjectPlay, ProjectPlayProvider] = createProvider(
  (defaultValue?: { requestedMode?: ProjectPlayLaunchMode }) => {
  const {
    applyPlaySettings,
    classes,
    getPlaySettingsFormValues,
    isApplyingPlaySettings,
    playSettings,
  } = useProjectOne()
  const [settingsOpened, setSettingsOpened] = useState(false)
  const [launchModeOverride, setLaunchModeOverride] = useState<
    ProjectPlayLaunchMode | undefined
  >(defaultValue?.requestedMode)

  const effectivePlaySettings = useMemo(
    () => ({
      ...playSettings,
      mode: resolveLaunchPlayMode({
        classes,
        fallbackMode: playSettings.mode,
        requestedMode: launchModeOverride,
      }),
    }),
    [classes, launchModeOverride, playSettings],
  )

  async function submitPlaySettings(values: ProjectPlaySettingsFormValues) {
    await applyPlaySettings(values)
    setLaunchModeOverride(undefined)
    setSettingsOpened(false)
  }

  return {
    getPlaySettingsFormValues: () =>
      launchModeOverride == null
        ? getPlaySettingsFormValues()
        : projectPlaySettingsToFormValues(effectivePlaySettings),
    isApplyingPlaySettings,
    playSettings: effectivePlaySettings,
    setSettingsOpened,
    settingsOpened,
    submitPlaySettings,
  }
  },
)
