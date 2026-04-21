export const DEFAULT_SAMPLE_PATH_PATTERN =
  'projects/{projectId}/samples/{classId}/{fileName}';

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
