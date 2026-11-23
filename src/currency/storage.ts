import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { CURRENCY_KEY } from '../constants';
import { isCurrencyId, type CurrencyId } from '../domain/money';

export async function loadCurrency(): Promise<CurrencyId> {
  const raw = Platform.OS === 'web' ? readWeb() : await SecureStore.getItemAsync(CURRENCY_KEY);
  return isCurrencyId(raw) ? raw : 'inr';
}

export async function saveCurrency(id: CurrencyId): Promise<void> {
  if (Platform.OS === 'web') {
    writeWeb(id);
    return;
  }
  await SecureStore.setItemAsync(CURRENCY_KEY, id);
}

function readWeb(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CURRENCY_KEY);
}

function writeWeb(value: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CURRENCY_KEY, value);
}
