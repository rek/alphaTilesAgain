/**
 * Font-loading gate hook. Wraps expo-font's useFonts: `{ ready, failed }`.
 *
 * util-theme is the ONLY library permitted to import expo-font.
 * All other libraries that need font-readiness must receive it as a prop
 * or use this hook via @shared/util-theme.
 *
 * Called in feature-loading's AppShell (root layout):
 *   const { ready, failed } = useFontsReady(fontAssetMap); // useLangAssets().fonts
 *   if (!ready) return null;
 *   // failed → give ThemeProvider no font names (system font everywhere)
 *
 * fontMap — Record<string, FontSource> matching expo-font's useFonts signature.
 * Typically: { primary: require(...ttf), primaryBold: require(...ttf) }; empty
 * map (pack without fonts/) is ready immediately.
 *
 * A load error (e.g. web FontFaceObserver 12s timeout, corrupt TTF) counts as
 * ready so the app never renders nothing forever, and sets `failed` so the
 * caller drops the pack font names — otherwise native logs "Unrecognized font
 * family" and falls back inconsistently per platform.
 *
 * See design.md §D5.
 */
import { useFonts } from 'expo-font';
import type { FontSource } from 'expo-font';

export function useFontsReady(fontMap: Record<string, FontSource>): { ready: boolean; failed: boolean } {
  const [loaded, error] = useFonts(fontMap);
  return { ready: loaded || error != null, failed: error != null };
}
