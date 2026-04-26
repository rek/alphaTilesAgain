/**
 * Port of Georgia.java setWord (~173–195) — picks a reference word and
 * computes the band-specific `correct` tile / syllable.
 *
 * For the tile variant, applies the CorV filter recursively: if the computed
 * `correct` tile's text isn't in the corV list, retries with a fresh word.
 *
 * For the syllable variant, the CorV filter is NOT applied (Java's recursion
 * lives inside the non-S branch only).
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType } from '@shared/util-phoneme';
import { parseWordIntoTiles } from '@shared/util-phoneme';
import { correctForTile } from './correctForTile';

type WordRow = LangAssets['words']['rows'][number];
type TileRow = LangAssets['tiles']['rows'][number];

export type GeorgiaTilePick =
  | {
      kind: 'T';
      word: WordRow;
      parsed: ParsedTile[];
      correct: ParsedTile;
    }
  | { error: 'insufficient-content' };

export type GeorgiaSyllablePick =
  | {
      kind: 'S';
      word: WordRow;
    }
  | { error: 'insufficient-content' };

export function pickGeorgiaTileWord({
  level,
  words,
  tiles,
  corVTexts,
  scriptType,
  placeholderCharacter,
  rng,
  maxAttempts = 50,
}: {
  level: number;
  words: WordRow[];
  tiles: TileRow[];
  corVTexts: Set<string>;
  scriptType: ScriptType;
  placeholderCharacter: string;
  rng: () => number;
  maxAttempts?: number;
}): GeorgiaTilePick {
  if (words.length === 0) return { error: 'insufficient-content' };
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const idx = Math.floor(rng() * words.length);
    const word = words[idx];
    const parsed = parseWordIntoTiles({
      wordInLOP: word.wordInLOP,
      mixedDefs: word.mixedDefs,
      tiles,
      scriptType,
      placeholderCharacter,
    });
    if (!parsed || parsed.length === 0) continue;
    const correct = correctForTile(parsed, level);
    if (!correct) continue;
    if (!corVTexts.has(correct.base)) continue;
    return { kind: 'T', word, parsed, correct };
  }
  return { error: 'insufficient-content' };
}

export function pickGeorgiaSyllableWord({
  words,
  rng,
}: {
  words: WordRow[];
  rng: () => number;
}): GeorgiaSyllablePick {
  if (words.length === 0) return { error: 'insufficient-content' };
  const idx = Math.floor(rng() * words.length);
  return { kind: 'S', word: words[idx] };
}
