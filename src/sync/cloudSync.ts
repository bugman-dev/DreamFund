import { ensureAccessToken } from '../auth/ensureAccessToken';
import { buildBackup, importBackup } from '../db/repository';
import type { CurrencyId } from '../domain/money';
import { t } from '../locale/messages';
import { downloadCloudBackup, downloadGoalImages, readCloudBackupMeta, uploadCloudBackup, uploadGoalImages } from './driveBackup';
import { loadLastSyncedAt, saveLastSyncedAt } from './syncMeta';

export type SyncProbe =
  | { status: 'upload' }
  | { status: 'choice'; cloudExportedAt: string };

export async function probeCloudSync(userId: string): Promise<SyncProbe> {
  await ensureAccessToken();
  const cloud = await readCloudBackupMeta();
  if (!cloud) return { status: 'upload' };
  const lastSyncedAt = await loadLastSyncedAt(userId);
  if (!lastSyncedAt || cloud.exportedAt > lastSyncedAt) {
    return { status: 'choice', cloudExportedAt: cloud.exportedAt };
  }
  return { status: 'upload' };
}

export async function uploadToCloud(userId: string): Promise<string> {
  await ensureAccessToken();
  const backup = await buildBackup(userId);
  const withImages = await uploadGoalImages(backup);
  await uploadCloudBackup(withImages);
  await saveLastSyncedAt(userId, withImages.exportedAt);
  return withImages.exportedAt;
}

export async function restoreFromCloud(userId: string, currency: CurrencyId): Promise<string> {
  await ensureAccessToken();
  const backup = await downloadCloudBackup();
  const withImages = await downloadGoalImages(backup);
  await importBackup(userId, withImages, currency);
  await saveLastSyncedAt(userId, withImages.exportedAt);
  return withImages.exportedAt;
}

export function syncChoiceMessage(cloudExportedAt: string): string {
  return t('sync.choiceMessage', { when: formatSyncTime(cloudExportedAt) });
}

export function formatSyncTime(iso: string | null): string {
  if (!iso) return t('sync.never');
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return t('sync.never');
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
