/**
 * iconicWord override resolver — used at challengeLevel 2.
 *
 * Port of `Iraq.java:292-340` — when CL2 and the tile has a non-empty
 * `iconicWord` (not null, not empty, not "-"), the displayed word MUST be that
 * iconicWord regardless of `scanSetting`.
 *
 * Returns `null` to signal "no override" → caller falls through to scanSetting
 * lookup. Returns the matching word from the wordlist when an override applies.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type Word = LangAssets['words']['rows'][number];

export type IconicTile = { iconicWord: string };

/**
 * Resolve iconic word override for the given tile / level.
 *
 * - If `level !== 2` → returns null.
 * - If iconicWord is `null`/`undefined`/empty/`"-"` → returns null.
 * - Otherwise looks up the word in `words` by `wordInLOP` and returns it.
 *   If lookup fails returns null (caller should fall through).
 */
export function resolveIconicWordOverride(
  tile: IconicTile,
  words: Word[],
  level: number,
): Word | null {
  if (level !== 2) return null;
  const iconic = tile.iconicWord;
  if (!iconic || iconic === '-') return null;
  return words.find((w) => w.wordInLOP === iconic) ?? null;
}
