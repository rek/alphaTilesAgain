/**
 * The pack font scale from the current Theme.
 *
 * Unlike useTheme(), does NOT throw outside <ThemeProvider>: falls back to
 * 1.0. Screens that render before the pack theme exists (ErrorScreen,
 * LoadingScreen) and presenter tests without a provider keep today's sizes.
 */
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { DEFAULT_FONT_SCALE } from './fontScale';

export function useFontScale(): number {
  return useContext(ThemeContext)?.fontScale ?? DEFAULT_FONT_SCALE;
}
