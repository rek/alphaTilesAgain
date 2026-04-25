/**
 * Port of Peru.java:chooseWord.
 * Pick a random word that parses to >= 2 tiles (CL2/CL3 use `nextInt(len-1)`,
 * so length 1 would crash). CL1 needs only the first-tile distractor trio,
 * but we keep the same minimum for consistency.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';
import type { ParsedTile, ScriptType } from '@shared/util-phoneme';
import { parseWordIntoTiles } from '@shared/util-phoneme';

type Word = LangAssets['words']['rows'][number];
type Tile = LangAssets['tiles']['rows'][number];

export type PeruWordPick =
  | { word: Word; parsed: ParsedTile[] }
  | { error: 'insufficient-content' };

export function pickPeruWord({
  words,
  tiles,
  scriptType,
  placeholderCharacter,
  rng = Math.random,
  maxAttempts = 50,
}: {
  words: Word[];
  tiles: Tile[];
  scriptType: ScriptType;
  placeholderCharacter: string;
  rng?: () => number;
  maxAttempts?: number;
}): PeruWordPick {
  if (words.length === 0) return { error: 'insufficient-content' };

  const pool = [...words];
  for (let attempt = 0; attempt < maxAttempts && pool.length > 0; attempt++) {
    const idx = Math.floor(rng() * pool.length);
    const candidate = pool.splice(idx, 1)[0];
    const parsed = parseWordIntoTiles({
      wordInLOP: candidate.wordInLOP,
      mixedDefs: candidate.mixedDefs,
      tiles,
      scriptType,
      placeholderCharacter,
    });
    if (parsed && parsed.length >= 2) {
      return { word: candidate, parsed };
    }
  }
  return { error: 'insufficient-content' };
}
