/**
 * Resolves manifest font require() numbers into LangAssets.fonts.
 *
 * primary is required; throws LangAssetsBindError if absent.
 * primaryBold is optional.
 *
 * See design.md §D3.
 */

import type { LangAssets } from '../LangAssets';
import { LangAssetsBindError } from '../LangAssetsBindError';

type ManifestFonts = {
  primary?: number;
  primaryBold?: number;
};

export function resolveFonts(manifestFonts: ManifestFonts): LangAssets['fonts'] {
  if (manifestFonts.primary === undefined) {
    throw new LangAssetsBindError({
      category: 'font',
      key: 'primary',
      reason: 'fonts.primary is required but absent from manifest',
    });
  }
  const result: LangAssets['fonts'] = { primary: manifestFonts.primary };
  if (manifestFonts.primaryBold !== undefined) {
    result.primaryBold = manifestFonts.primaryBold;
  }
  return result;
}
