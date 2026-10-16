/**
 * Provider that builds and memoizes the Theme from palette + fontMap props.
 * Mount once at app root (inside LangAssetsProvider, after fonts are ready).
 *
 * Re-renders produce the same Theme reference as long as palette and fontMap
 * are reference-stable — useMemo([palette, fontMap]).
 *
 * See design.md §D4.
 */
import React, { useMemo } from 'react';
import { buildTheme } from './buildTheme';
import type { FontMap } from './buildTheme';
import { ThemeContext } from './ThemeContext';

type Props = {
  palette: readonly string[];
  fontMap: FontMap;
  /** Pack "Font Scale" (parsed/clamped). Defaults to 1.0. */
  fontScale?: number;
  children: React.ReactNode;
};

export function ThemeProvider({
  palette,
  fontMap,
  fontScale,
  children,
}: Props): React.JSX.Element {
  const theme = useMemo(
    () => buildTheme(palette, fontMap, fontScale),
    [palette, fontMap, fontScale],
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
