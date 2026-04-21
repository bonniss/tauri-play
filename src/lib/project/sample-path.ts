export function resolveSampleFilePath(
  pattern: string,
  projectId: string,
  classId: string,
  fileName: string,
): string {
  return pattern
    .replace('{projectId}', projectId)
    .replace('{classId}', classId)
    .replace('{fileName}', fileName);
}
