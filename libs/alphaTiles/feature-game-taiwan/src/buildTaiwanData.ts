/**
 * Precompute for game-taiwan.
 *
 * Decomposes compound tile glyphs (e.g. "醫生") into single hanzi and filters to
 * those for which stroke data is present in `assets.strokes`. Char audio
 * (syllable clip, else first compound containing it — D5) is pack speech's job.
 *
 * Returns:
 *   - availableTiles: distinct hanzi with stroke data, sorted ascending by
 *     stroke count (tiebreak: first appearance in tiles). Drives simple→complex
 *     character progression in-game (issue #20).
 *
 * Stage-filtering is deferred to v1.1 (design Open Q #6) — for v1 every char
 * with stroke data is eligible regardless of player progress.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type TaiwanData = {
  availableTiles: string[];
};

export function buildTaiwanData(assets: LangAssets): TaiwanData {
  const charsWithStrokes = new Set(Object.keys(assets.strokes));

  const firstSeenOrder: string[] = [];
  const seen = new Set<string>();

  for (const tile of assets.tiles.rows) {
    for (const ch of [...tile.base.trim()]) {
      if (!charsWithStrokes.has(ch) || seen.has(ch)) continue;
      seen.add(ch);
      firstSeenOrder.push(ch);
    }
  }

  const strokeCount = (ch: string): number => assets.strokes[ch]?.strokes.length ?? 0;
  const availableTiles = firstSeenOrder
    .map((ch, idx) => ({ ch, count: strokeCount(ch), idx }))
    .sort((a, b) => a.count - b.count || a.idx - b.idx)
    .map((e) => e.ch);

  if (availableTiles.length === 0 && Object.keys(assets.strokes).length > 0) {
    console.warn(
      '[feature-game-taiwan] strokes present but no tile chars matched — check aa_gametiles.txt',
    );
  }

  return { availableTiles };
}
