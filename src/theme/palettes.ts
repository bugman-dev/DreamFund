export type Palette = {
  forest: string;
  ivory: string;
  white: string;
  sage: string;
  paleSage: string;
  amber: string;
  sky: string;
  rose: string;
  roseSoft: string;
  grey: string;
  ink: string;
  muted: string;
  onForest: string;
  statusBar: "dark" | "light";
};

export const PALETTE_IDS = ["forest", "ocean", "dusk"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export const palettes: Record<PaletteId, Palette> = {
  forest: {
    forest: "#123F32",
    ivory: "#F7F2E9",
    white: "#FFFCF6",
    sage: "#2F6F59",
    paleSage: "#DDE8DD",
    amber: "#F5AD43",
    sky: "#159BD7",
    rose: "#C96F66",
    roseSoft: "#F6E6E3",
    grey: "#E7E3DC",
    ink: "#1E2823",
    muted: "#6B726C",
    onForest: "#FFFCF6",
    statusBar: "dark",
  },
  ocean: {
    forest: "#0E3A4D",
    ivory: "#F3F6F8",
    white: "#FBFDFF",
    sage: "#1F6F8A",
    paleSage: "#D5E6EE",
    amber: "#F5AD43",
    sky: "#159BD7",
    rose: "#C96F66",
    roseSoft: "#F6E6E3",
    grey: "#E2E8EC",
    ink: "#1A2428",
    muted: "#667278",
    onForest: "#FBFDFF",
    statusBar: "dark",
  },
  dusk: {
    forest: "#2F6F59",
    ivory: "#121816",
    white: "#1C2622",
    sage: "#7DBFA6",
    paleSage: "#24332C",
    amber: "#F5AD43",
    sky: "#4EB3D6",
    rose: "#E08B82",
    roseSoft: "#3A2826",
    grey: "#2C3833",
    ink: "#F4F1EA",
    muted: "#A7B0AA",
    onForest: "#F4F1EA",
    statusBar: "light",
  },
};

export function isPaletteId(
  value: string | null | undefined,
): value is PaletteId {
  return value === "forest" || value === "ocean" || value === "dusk";
}
