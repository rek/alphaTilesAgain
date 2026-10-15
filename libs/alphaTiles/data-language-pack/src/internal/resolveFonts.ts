/**
 * Resolves manifest font require() numbers into LangAssets.fonts.
 *
 * Both entries optional. A pack with no fonts/ (e.g. yue, CJK) renders with
 * the platform system font. Generator emits `null` for absent fonts.
 *
 * See design.md §D3.
 */

import type { LangAssets } from '../LangAssets';

type ManifestFonts = {
  primary?: number | null;
  primaryBold?: number | null;
};

export function resolveFonts(manifestFonts: ManifestFonts): LangAssets['fonts'] {
  const result: LangAssets['fonts'] = {};
  if (manifestFonts.primary != null) {
    result.primary = manifestFonts.primary;
  }
  if (manifestFonts.primaryBold != null) {
    result.primaryBold = manifestFonts.primaryBold;
  }
  return result;
}
