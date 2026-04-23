/**
 * Font-loading gate hook. Wraps expo-font's useFonts to return a plain boolean.
 *
 * util-theme is the ONLY library permitted to import expo-font.
 * All other libraries that need font-readiness must receive it as a prop
 * or use this hook via @shared/util-theme.
 *
 * Called in apps/alphaTiles/app/_layout.tsx:
 *   const ready = useFontsReady(langManifest.fonts);
 *   if (!ready) return null;
 *
 * fontMap — Record<string, FontSource> matching expo-font's useFonts signature.
 * Typically: { primary: require(...ttf), primaryBold: require(...ttf) }
 *
 * See design.md §D5.
 */
import { useFonts } from 'expo-font';
import type { FontSource } from 'expo-font';

export function useFontsReady(fontMap: Record<string, FontSource>): boolean {
  const [loaded] = useFonts(fontMap);
  return loaded;
}
