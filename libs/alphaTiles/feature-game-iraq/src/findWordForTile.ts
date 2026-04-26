/**
 * Find a word containing `tileBase` at the position dictated by `scanSetting`.
 *
 * Port of `Iraq.java:346-376`:
 *   - case 1 (default): only position 1 (parsed index 0). No fallback.
 *   - case 2: position 1, fall back to position 2 if no matches at position 1.
 *   - case 3: only position 3 (parsed index 2). No fallback.
 *
 * `parseWord(word)` MUST return the tile-base array for that word
 * (caller wires up parseWordIntoTilesPreliminary). Words whose parse fails
 * (returns `[]`) are skipped — same as Java's null-parse behaviour.
 *
 * Returns `null` when no candidate word exists (caller plays tile audio
 * and reverts without showing an overlay — matches Java skipThisTile branch
 * lines 416-421).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];

export type ScanSetting = 1 | 2 | 3;

export type FindWordForTileOptions = {
  tileBase: string;
  words: Word[];
  scanSetting: ScanSetting;
  parseWord: (word: Word) => string[];
  /** Random number generator — defaults to Math.random; injected for tests. */
  rng?: () => number;
};

function pickRandom<T>(arr: T[], rng: () => number): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function wordsAtPosition(
  words: Word[],
  parseWord: (w: Word) => string[],
  position: number,
  tileBase: string,
): Word[] {
  const matches: Word[] = [];
  for (const word of words) {
    const parsed = parseWord(word);
    if (parsed[position] === tileBase) matches.push(word);
  }
  return matches;
}

export function findWordForTile({
  tileBase,
  words,
  scanSetting,
  parseWord,
  rng = Math.random,
}: FindWordForTileOptions): Word | null {
  if (scanSetting === 3) {
    // Position 3 only (parsed index 2). No fallback.
    return pickRandom(wordsAtPosition(words, parseWord, 2, tileBase), rng);
  }

  // scan === 1 or 2: try position 1 (parsed index 0) first.
  const pos1 = wordsAtPosition(words, parseWord, 0, tileBase);
  if (pos1.length > 0) return pickRandom(pos1, rng);

  // scan === 2 only: fall back to position 2 (parsed index 1).
  if (scanSetting === 2) {
    return pickRandom(wordsAtPosition(words, parseWord, 1, tileBase), rng);
  }

  // scan === 1: no fallback.
  return null;
}
