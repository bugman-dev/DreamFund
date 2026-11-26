import { THEME_KEY } from "../constants";
import { readDeviceValue, writeDeviceValue } from "../storage/deviceValue";
import { isPaletteId, type PaletteId } from "./palettes";

export async function loadTheme(): Promise<PaletteId> {
  const stored = await readDeviceValue(THEME_KEY);
  return isPaletteId(stored) ? stored : "forest";
}

export async function saveTheme(id: PaletteId): Promise<void> {
  await writeDeviceValue(THEME_KEY, id);
}
