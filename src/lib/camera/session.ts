const WORKING_PROJECT_ID_STORAGE_KEY = "$workingProjectId"

export function getOrCreateWorkingProjectId() {
  const existing = window.localStorage.getItem(WORKING_PROJECT_ID_STORAGE_KEY)

  if (existing) {
    return existing
  }

  const nextId = crypto.randomUUID()
  window.localStorage.setItem(WORKING_PROJECT_ID_STORAGE_KEY, nextId)

  return nextId
}
