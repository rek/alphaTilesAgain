/**
 * Hook: read the current Theme from context.
 * Throws a clear error when called outside <ThemeProvider>.
 *
 * Every type:ui component obtains tokens via this hook only.
 * Direct imports of palette / typography / spacing constants are
 * not part of the public API — use useTheme().
 *
 * See design.md §D4.
 */
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import type { Theme } from './buildTheme';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (theme === null) {
    throw new Error('useTheme must be called inside <ThemeProvider>');
  }
  return theme;
}
