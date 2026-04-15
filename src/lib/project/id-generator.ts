export function unsnake_uuid() {
  return crypto.randomUUID().replace(/-/g, "")
}

export function randomBase36(length: number) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) => (byte % 36).toString(36)).join("")
}

export function genProjectId() {
  return randomBase36(20)
}

export function genClassId() {
  return randomBase36(10)
}

export function genSampleId() {
  return `${+new Date()}_${randomBase36(8)}`
}

export function genModelId() {
  return `${+new Date()}_model_${randomBase36(6)}`
}

export function genTrainLogId() {
  return `${+new Date()}_train_${randomBase36(6)}`
}
