import type { ProjectPlaySettings } from './settings'

type SampleSourceLike = {
  source: 'camera' | 'upload'
}

type ProjectClassLike = {
  samples: SampleSourceLike[]
}

export type ProjectPlayLaunchMode = 'auto' | 'upload' | 'camera'

export function inferPreferredPlayMode(
  classes: ProjectClassLike[],
  fallbackMode: ProjectPlaySettings['mode'],
) {
  let cameraSamples = 0
  let uploadSamples = 0

  classes.forEach((projectClass) => {
    projectClass.samples.forEach((sample) => {
      if (sample.source === 'camera') {
        cameraSamples += 1
        return
      }

      uploadSamples += 1
    })
  })

  const totalSamples = cameraSamples + uploadSamples

  if (totalSamples === 0) {
    return fallbackMode
  }

  if (cameraSamples === 0) {
    return 'upload'
  }

  if (uploadSamples === 0) {
    return 'camera'
  }

  const cameraRatio = cameraSamples / totalSamples
  const uploadRatio = uploadSamples / totalSamples

  if (cameraRatio >= 0.6) {
    return 'camera'
  }

  if (uploadRatio >= 0.6) {
    return 'upload'
  }

  return fallbackMode
}

export function resolveLaunchPlayMode({
  classes,
  fallbackMode,
  requestedMode,
}: {
  classes: ProjectClassLike[]
  fallbackMode: ProjectPlaySettings['mode']
  requestedMode?: ProjectPlayLaunchMode
}) {
  if (requestedMode === 'camera' || requestedMode === 'upload') {
    return requestedMode
  }

  if (requestedMode === 'auto') {
    return inferPreferredPlayMode(classes, fallbackMode)
  }

  return fallbackMode
}
