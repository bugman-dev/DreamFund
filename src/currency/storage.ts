import { CURRENCY_KEY } from "../constants";
import { isCurrencyId, type CurrencyId } from "../domain/money";
import { readDeviceValue, writeDeviceValue } from "../storage/deviceValue";

export async function loadCurrency(): Promise<CurrencyId> {
  const stored = await readDeviceValue(CURRENCY_KEY);
  return isCurrencyId(stored) ? stored : "inr";
}

export async function saveCurrency(id: CurrencyId): Promise<void> {
  await writeDeviceValue(CURRENCY_KEY, id);
}
