import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { THEME_KEY } from '../constants';
import { isPaletteId, type PaletteId } from './palettes';

export async function loadTheme(): Promise<PaletteId> {
  const raw = Platform.OS === 'web' ? readWeb() : await SecureStore.getItemAsync(THEME_KEY);
  return isPaletteId(raw) ? raw : 'forest';
}

export async function saveTheme(id: PaletteId): Promise<void> {
  if (Platform.OS === 'web') {
    writeWeb(id);
    return;
  }
  await SecureStore.setItemAsync(THEME_KEY, id);
}

function readWeb(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(THEME_KEY);
}

function writeWeb(value: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_KEY, value);
}
