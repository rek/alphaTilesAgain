/**
 * Pick one tile in `parsed` whose `typeOfThisTileInstance` matches the CL
 * requirement, replacing it with a script-aware placeholder. Never blanks a
 * SAD tile.
 *
 * Port of Brazil.java removeTile (~lines 240-310).
 */
import type { ParsedTile } from '@shared/util-phoneme';

type RequiredType = 'vowel' | 'consonant' | 'tone';

const VOWEL_TYPES = new Set(['LV', 'AV', 'BV', 'FV', 'V']);

function matchesRequired(tile: ParsedTile, required: RequiredType): boolean {
  if (required === 'vowel') return VOWEL_TYPES.has(tile.typeOfThisTileInstance);
  if (required === 'consonant') return tile.typeOfThisTileInstance === 'C';
  return tile.typeOfThisTileInstance === 'T';
}

export type BlankResult = {
  /** Parsed tile array with the chosen index replaced by a placeholder tile. */
  display: Array<{ text: string; isBlank: boolean }>;
  /** The tile that was blanked (the "correct answer" for the round). */
  correct: ParsedTile;
  /** Index in `parsed` that was blanked. */
  blankIndex: number;
};

export function blankRandomTileOfType(
  parsed: ParsedTile[],
  required: RequiredType,
  scriptType: string,
  placeholderCharacter: string,
  rand: () => number = Math.random,
): BlankResult | null {
  const candidates: number[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const t = parsed[i];
    if (t.typeOfThisTileInstance === 'SAD') continue;
    if (matchesRequired(t, required)) candidates.push(i);
  }

  if (candidates.length === 0) return null;

  const pickIndex = candidates[Math.floor(rand() * candidates.length)];
  const correct = parsed[pickIndex];

  // Determine placeholder text per script (Brazil.java removeTile lines 290-308).
  let placeholder = '__';
  if (correct.typeOfThisTileInstance === 'C') {
    if (scriptType === 'Khmer') {
      const next = parsed[pickIndex + 1];
      const nextType = next ? next.typeOfThisTileInstance : '';
      if (nextType === 'V' || nextType === 'AV' || nextType === 'BV' || nextType === 'D') {
        placeholder = '​'; // zero-width space
      } else {
        placeholder = placeholderCharacter;
      }
    } else if (scriptType === 'Thai' || scriptType === 'Lao') {
      placeholder = placeholderCharacter;
    }
  }

  const display = parsed.map((t, i) => ({
    text: i === pickIndex ? placeholder : t.base,
    isBlank: i === pickIndex,
  }));

  return { display, correct, blankIndex: pickIndex };
}
