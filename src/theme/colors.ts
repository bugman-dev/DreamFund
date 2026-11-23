export const colors = {
  forest: '#123F32',
  ivory: '#F7F2E9',
  white: '#FFFCF6',
  sage: '#2F6F59',
  paleSage: '#DDE8DD',
  amber: '#F5AD43',
  sky: '#159BD7',
  rose: '#C96F66',
  roseSoft: '#F6E6E3',
  grey: '#E7E3DC',
  ink: '#1E2823',
  muted: '#6B726C',
};

const accents: Record<string, string> = {
  'Home & Living': colors.sage,
  Travel: colors.amber,
  Personal: colors.forest,
  Shopping: colors.sage,
  Education: colors.sky,
  Gadget: colors.sky,
};

export function accentFor(name: string | undefined): string {
  if (!name) return colors.sage;
  return accents[name] ?? colors.sage;
}
