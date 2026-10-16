/**
 * Builds a component's style sheet at the pack font scale.
 *
 * Does NOT throw outside <ThemeProvider> (falls back to 1.0) — see
 * useFontScale. See font-scaling-accessibility design.md §D7.
 *
 *   const stylesFor = (fs: number) =>
 *     StyleSheet.create({ label: { fontSize: 18 * fs } });
 *   // inside the component:
 *   const styles = useScaledStyles(stylesFor);
 *
 * `factory` must be module-level (stable reference) so the memo holds.
 */
import { useMemo } from 'react';
import { useFontScale } from './useFontScale';

export function useScaledStyles<T>(factory: (fontScale: number) => T): T {
  const fontScale = useFontScale();
  return useMemo(() => factory(fontScale), [factory, fontScale]);
}
