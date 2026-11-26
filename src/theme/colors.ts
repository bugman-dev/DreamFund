import type { Palette } from "./palettes";
import { palettes } from "./palettes";

export const colors = palettes.forest;

const ACCENT_KEYS = ["sage", "amber", "sky", "forest"] as const;

export function accentFor(
  name: string | undefined,
  palette: Palette = colors,
): string {
  if (!name) return palette.sage;
  let hash = 0;
  for (const char of name) hash = Math.imul(hash, 33) + char.charCodeAt(0);
  return palette[ACCENT_KEYS[Math.abs(hash) % ACCENT_KEYS.length]];
}
