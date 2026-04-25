/**
 * Wrap a word-picker (typically selectWordForStage) so it retries until the
 * parsed word contains at least one tile of the required type.
 *
 * Port of Brazil.java setWord (~lines 200-235): recurses on chooseWord() until
 * `proceed === true` for the CL's required tile type.
 */
import type { ParsedTile } from '@shared/util-phoneme';

const VOWEL_TYPES = new Set(['LV', 'AV', 'BV', 'FV', 'V']);

export type RequiredTileType = 'vowel' | 'consonant' | 'tone';

export function wordHasRequiredType(
  parsed: ParsedTile[],
  required: RequiredTileType,
): boolean {
  for (const t of parsed) {
    if (required === 'vowel' && VOWEL_TYPES.has(t.typeOfThisTileInstance)) return true;
    if (required === 'consonant' && t.typeOfThisTileInstance === 'C') return true;
    if (required === 'tone' && t.typeOfThisTileInstance === 'T') return true;
  }
  return false;
}

export type PickWordOfTypeOpts<W> = {
  pickOne: () => W;
  parse: (word: W) => ParsedTile[] | null;
  required: RequiredTileType;
  maxAttempts?: number;
};

export function pickWordOfType<W>({
  pickOne,
  parse,
  required,
  maxAttempts = 50,
}: PickWordOfTypeOpts<W>): { word: W; parsed: ParsedTile[] } | null {
  for (let i = 0; i < maxAttempts; i++) {
    const word = pickOne();
    const parsed = parse(word);
    if (parsed && wordHasRequiredType(parsed, required)) {
      return { word, parsed };
    }
  }
  return null;
}
