import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SessionUser } from './types';

const KEY = 'dreamfund.session';

export async function loadSession(): Promise<SessionUser | null> {
  const raw = Platform.OS === 'web' ? readWeb() : await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed.sub || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(user: SessionUser): Promise<void> {
  const raw = JSON.stringify(user);
  if (Platform.OS === 'web') {
    writeWeb(raw);
    return;
  }
  await SecureStore.setItemAsync(KEY, raw);
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    writeWeb(null);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}

function readWeb(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(KEY);
}

function writeWeb(value: string | null) {
  if (typeof localStorage === 'undefined') return;
  if (value == null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, value);
}
