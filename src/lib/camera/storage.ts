import { BaseDirectory, mkdir, writeFile } from '@tauri-apps/plugin-fs';

const DEFAULT_CLASS_ID = 'unclassified';

function dataUrlToBytes(dataUrl: string) {
  const [, base64 = ''] = dataUrl.split(',', 2);
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export async function saveCapturedImage({
  classId = DEFAULT_CLASS_ID,
  dataUrl,
  projectId,
}: {
  classId?: string;
  dataUrl: string;
  projectId: string;
}) {
  const directoryPath = `projects/${projectId}/samples/${classId}`;
  const fileName = generateSampleFileName();
  const filePath = `${directoryPath}/${fileName}`;

  await mkdir(directoryPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  });

  await writeFile(filePath, dataUrlToBytes(dataUrl), {
    baseDir: BaseDirectory.AppData,
  });

  return {
    classId,
    fileName,
    filePath,
    projectId,
  };
}

function generateSampleFileName() {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const ms = pad(now.getMilliseconds(), 3);
  const suffix = crypto.randomUUID().slice(0, 4);

  return `${date}_${time}_${ms}_${suffix}.jpg`;
}
