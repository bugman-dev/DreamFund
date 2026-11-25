import { SYNC_META_KEY_PREFIX } from '../constants';
import { readDeviceValue, writeDeviceValue } from '../storage/deviceValue';

export async function loadLastSyncedAt(userId: string): Promise<string | null> {
  return readDeviceValue(`${SYNC_META_KEY_PREFIX}${userId}`);
}

export async function saveLastSyncedAt(userId: string, iso: string): Promise<void> {
  await writeDeviceValue(`${SYNC_META_KEY_PREFIX}${userId}`, iso);
}
