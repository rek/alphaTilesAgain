/**
 * Build the alphabetised tile list for Iraq.
 *
 * Port of `Iraq.java:113-164`:
 *   1. Filter cumulativeStageBasedTileList — drop SAD tiles and silent
 *      placeholder consonants (PC + audio "zz_no_audio_needed").
 *   2. Sort alphabetically by tile.base.
 *   3. When `differentiatesTileTypes === false`, drop later duplicates
 *      whose `base` already appeared (multitype dedup, lines 151-162).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type TileRow = LangAssets['tiles']['rows'][number];

const SILENT_AUDIO = 'zz_no_audio_needed';

export type BuildIraqTileListOptions = {
  /** All tiles eligible for display — typically the full tileList for v1. */
  tiles: TileRow[];
  /** When false, collapse duplicates by `base`. */
  differentiatesTileTypes: boolean;
};

export function buildIraqTileList({
  tiles,
  differentiatesTileTypes,
}: BuildIraqTileListOptions): TileRow[] {
  // 1. Filter SAD + silent placeholder consonants (Iraq.java:117-119)
  const filtered = tiles.filter((tile) => {
    if (tile.type === 'SAD') return false;
    if (tile.type === 'PC' && tile.audioName === SILENT_AUDIO) return false;
    return true;
  });

  // 2. Sort alphabetically by tile.base (Iraq.java:123)
  const sorted = [...filtered].sort((a, b) => a.base.localeCompare(b.base));

  // 3. Multitype dedup when !differentiatesTileTypes (Iraq.java:151-162)
  if (differentiatesTileTypes) return sorted;

  const seen = new Set<string>();
  const deduped: TileRow[] = [];
  for (const tile of sorted) {
    if (seen.has(tile.base)) continue;
    seen.add(tile.base);
    deduped.push(tile);
  }
  return deduped;
}
