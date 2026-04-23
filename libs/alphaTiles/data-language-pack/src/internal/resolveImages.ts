/**
 * Resolves manifest image require() numbers into domain-keyed maps.
 *
 * Output keys:
 *   - tiles:       tile.base (optional; empty map when no tile glyph images present)
 *   - words:       word.wordInLWC (primary image; throws if missing)
 *   - wordsAlt:    word.wordInLWC (distractor variant '<word>2.png'; silent if absent)
 *   - avatars:     number[] verbatim from manifest (0-based index)
 *   - avataricons: number[] verbatim
 *   - icon:        direct pass-through
 *   - splash:      direct pass-through
 *
 * See design.md §D3.
 */

import type { LangAssets } from '../LangAssets';
import { LangAssetsBindError } from '../LangAssetsBindError';

type ManifestImages = {
  icon: number;
  splash: number;
  avatars: readonly number[];
  avataricons: readonly number[];
  tiles: Record<string, number>;
  words: Record<string, number>;
};

type ParsedPack = {
  tiles: { rows: Array<{ base: string }> };
  words: { rows: Array<{ wordInLWC: string }> };
};

export function resolveImages(
  manifestImages: ManifestImages,
  parsed: ParsedPack,
): LangAssets['images'] {
  const tiles: Record<string, number> = {};
  for (const tile of parsed.tiles.rows) {
    const h = manifestImages.tiles[tile.base];
    if (h !== undefined) {
      // Tile glyph images are optional — silently skip missing ones
      tiles[tile.base] = h;
    }
  }

  const words: Record<string, number> = {};
  const wordsAlt: Record<string, number> = {};
  for (const word of parsed.words.rows) {
    const key = word.wordInLWC;
    const primary = manifestImages.words[key];
    if (primary === undefined) {
      throw new LangAssetsBindError({
        category: 'word-image',
        key,
      });
    }
    words[key] = primary;
    const alt = manifestImages.words[`${key}2`];
    if (alt !== undefined) {
      wordsAlt[key] = alt;
    }
  }

  return {
    icon: manifestImages.icon,
    splash: manifestImages.splash,
    avatars: [...manifestImages.avatars],
    avataricons: [...manifestImages.avataricons],
    tiles,
    words,
    wordsAlt,
  };
}
