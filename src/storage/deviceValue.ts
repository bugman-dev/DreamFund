import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export async function readDeviceValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return readWeb(key);
  return SecureStore.getItemAsync(key);
}

export async function writeDeviceValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    writeWeb(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeDeviceValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    writeWeb(key, null);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function readWeb(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(key);
}

function writeWeb(key: string, value: string | null) {
  if (typeof localStorage === 'undefined') return;
  if (value == null) localStorage.removeItem(key);
  else localStorage.setItem(key, value);
}
