import type { Palette } from './palettes';
import { palettes } from './palettes';

export const colors = palettes.forest;

export function accentFor(name: string | undefined, palette: Palette = colors): string {
  const accents: Record<string, string> = {
    'Home & Living': palette.sage,
    Travel: palette.amber,
    Personal: palette.forest,
    Shopping: palette.sage,
    Education: palette.sky,
    Gadget: palette.sky,
  };
  if (!name) return palette.sage;
  return accents[name] ?? palette.sage;
}
