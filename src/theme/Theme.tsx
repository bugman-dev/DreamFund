import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isPaletteId, palettes, type Palette, type PaletteId } from './palettes';
import { loadTheme, saveTheme } from './storage';

type ThemeValue = {
  id: PaletteId;
  colors: Palette;
  ready: boolean;
  setTheme: (id: PaletteId) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<PaletteId>('forest');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadTheme()
      .then((stored) => {
        if (active) setId(stored);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((next: PaletteId) => {
    if (!isPaletteId(next)) return;
    setId(next);
    void saveTheme(next);
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({ id, colors: palettes[id], ready, setTheme }),
    [id, ready, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    return { id: 'forest', colors: palettes.forest, ready: true, setTheme: () => undefined };
  }
  return value;
}

export function useColors(): Palette {
  return useTheme().colors;
}
