import { CLOUD_BACKUP_NAME } from '../constants';
import { ensureAccessToken } from '../auth/ensureAccessToken';
import { googleDriveApiBase, googleDriveUploadBase } from '../auth/google';
import type { BackupFile } from '../domain/backup';
import { t } from '../locale/messages';
import { cloudImageName, isPresetImage, readImageBytes, writeGoalImageBytes } from './goalImages';

type DriveFile = { id: string; name: string };

async function driveFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await ensureAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return fetch(path, { ...init, headers });
}

async function listAppDataFiles(): Promise<DriveFile[]> {
  const url = `${googleDriveApiBase}/files?spaces=appDataFolder&pageSize=100&fields=files(id,name)`;
  const response = await driveFetch(url);
  if (!response.ok) throw new Error(t('sync.driveFailed'));
  const json = (await response.json()) as { files?: DriveFile[] };
  return json.files ?? [];
}

async function findNamedFile(name: string): Promise<DriveFile | null> {
  const files = await listAppDataFiles();
  return files.find((file) => file.name === name) ?? null;
}

async function createAppDataFile(name: string): Promise<string> {
  const response = await driveFetch(`${googleDriveApiBase}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parents: ['appDataFolder'] }),
  });
  if (!response.ok) throw new Error(t('sync.uploadFailed'));
  const json = (await response.json()) as { id?: string };
  if (!json.id) throw new Error(t('sync.uploadFailed'));
  return json.id;
}

async function uploadMedia(fileId: string, body: string | ArrayBuffer, contentType: string): Promise<void> {
  const payload = typeof body === 'string' ? body : body.slice(0);
  const response = await driveFetch(`${googleDriveUploadBase}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': contentType },
    body: payload,
  });
  if (!response.ok) throw new Error(t('sync.uploadFailed'));
}

export async function readCloudBackupMeta(): Promise<{ fileId: string; exportedAt: string } | null> {
  const file = await findNamedFile(CLOUD_BACKUP_NAME);
  if (!file) return null;
  const backup = await downloadJson(file.id);
  return { fileId: file.id, exportedAt: backup.exportedAt };
}

export async function downloadCloudBackup(): Promise<BackupFile> {
  const file = await findNamedFile(CLOUD_BACKUP_NAME);
  if (!file) throw new Error(t('sync.noCloud'));
  return downloadJson(file.id);
}

async function downloadJson(fileId: string): Promise<BackupFile> {
  const response = await driveFetch(`${googleDriveApiBase}/files/${fileId}?alt=media`);
  if (!response.ok) throw new Error(t('sync.driveFailed'));
  return (await response.json()) as BackupFile;
}

export async function uploadCloudBackup(backup: BackupFile): Promise<void> {
  const body = JSON.stringify(backup);
  const existing = await findNamedFile(CLOUD_BACKUP_NAME);
  const fileId = existing?.id ?? (await createAppDataFile(CLOUD_BACKUP_NAME));
  await uploadMedia(fileId, body, 'application/json; charset=UTF-8');
}

export async function uploadGoalImages(backup: BackupFile): Promise<BackupFile> {
  const imageFiles: Record<string, string> = {};
  const existing = await listAppDataFiles();
  const keep = new Set<string>([CLOUD_BACKUP_NAME]);

  for (const goal of backup.goals) {
    if (isPresetImage(goal.imageUri) || !goal.imageUri) continue;
    const image = await readImageBytes(goal.imageUri);
    if (!image) continue;
    const name = cloudImageName(goal.id, image.extension);
    imageFiles[goal.id] = name;
    keep.add(name);
    const found = existing.find((file) => file.name === name);
    const fileId = found?.id ?? (await createAppDataFile(name));
    await uploadMedia(fileId, image.bytes, image.mimeType);
  }

  for (const file of existing) {
    if (keep.has(file.name)) continue;
    if (!file.name.startsWith('goal-')) continue;
    await driveFetch(`${googleDriveApiBase}/files/${file.id}`, { method: 'DELETE' }).catch(() => undefined);
  }

  return { ...backup, imageFiles };
}

export async function downloadGoalImages(backup: BackupFile): Promise<BackupFile> {
  const files = await listAppDataFiles();
  const goals = [];
  for (const goal of backup.goals) {
    const fileName = backup.imageFiles?.[goal.id];
    if (!fileName) {
      goals.push(goal);
      continue;
    }
    const remote = files.find((file) => file.name === fileName);
    if (!remote) {
      goals.push({ ...goal, imageUri: null });
      continue;
    }
    const response = await driveFetch(`${googleDriveApiBase}/files/${remote.id}?alt=media`);
    if (!response.ok) {
      goals.push({ ...goal, imageUri: null });
      continue;
    }
    const bytes = await response.arrayBuffer();
    const extension = fileName.includes('.') ? fileName.split('.').pop() || 'jpg' : 'jpg';
    const localUri = await writeGoalImageBytes(goal.id, bytes, extension);
    goals.push({ ...goal, imageUri: localUri });
  }
  return { ...backup, goals };
}
