/**
 * Precompute for game-taiwan.
 *
 * Decomposes compound tile glyphs (e.g. "醫生") into single hanzi, filters to
 * those for which stroke data is present in `assets.strokes`, and builds a
 * compound-fallback audio map (D5 — character has no per-character audio in
 * the yue pack; we play the audio of the first compound containing the char).
 *
 * Returns:
 *   - availableTiles: distinct hanzi with stroke data (sorted by first appearance in tiles)
 *   - audioForChar:   char -> require()-id of a compound-word mp3 that contains it
 *
 * Stage-filtering is deferred to v1.1 (design Open Q #6) — for v1 every char
 * with stroke data is eligible regardless of player progress.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type TaiwanData = {
  availableTiles: string[];
  /** Maps a single hanzi to a word LWC key (a key into `assets.audio.words` /
   *  `useAudio.playWord(id)`). v1 falls back to the first compound containing
   *  the char because the yue pack doesn't ship per-character audio. */
  audioForChar: Record<string, string>;
};

export function buildTaiwanData(assets: LangAssets): TaiwanData {
  const charsWithStrokes = new Set(Object.keys(assets.strokes));

  const availableTiles: string[] = [];
  const seen = new Set<string>();

  for (const tile of assets.tiles.rows) {
    for (const ch of [...tile.base.trim()]) {
      if (!charsWithStrokes.has(ch) || seen.has(ch)) continue;
      seen.add(ch);
      availableTiles.push(ch);
    }
  }

  const audioForChar: Record<string, string> = {};
  for (const word of assets.words.rows) {
    if (assets.audio.words[word.wordInLWC] === undefined) continue;
    for (const ch of [...word.wordInLOP.trim()]) {
      if (!charsWithStrokes.has(ch)) continue;
      if (audioForChar[ch] !== undefined) continue;
      audioForChar[ch] = word.wordInLWC;
    }
  }

  if (availableTiles.length === 0 && Object.keys(assets.strokes).length > 0) {
    console.warn(
      '[feature-game-taiwan] strokes present but no tile chars matched — check aa_gametiles.txt',
    );
  }

  return { availableTiles, audioForChar };
}
