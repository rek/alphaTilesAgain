/**
 * Random distractor tile picker, mirrors Java tileList.returnRandomDistractorTile.
 *
 * Picks a random non-empty alt from the tile's trio (alt1/alt2/alt3) and looks
 * up the matching TileRow. Falls back to a random non-target tile if the trio
 * is empty.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type TileRow = LangAssets['tiles']['rows'][number];

export function drawTileDistractor({
  target,
  tilesByBase,
  allTiles,
  rng = Math.random,
}: {
  target: TileRow;
  tilesByBase: Map<string, TileRow>;
  allTiles: TileRow[];
  rng?: () => number;
}): TileRow {
  const trio = [target.alt1, target.alt2, target.alt3].filter((s) => !!s);
  if (trio.length > 0) {
    const replacement = trio[Math.floor(rng() * trio.length)];
    const row = tilesByBase.get(replacement);
    if (row) return row;
    // Fall through if row wasn't found (rare).
  }
  const candidates = allTiles.filter((t) => t.base !== target.base);
  if (candidates.length === 0) return target;
  return candidates[Math.floor(rng() * candidates.length)];
}
