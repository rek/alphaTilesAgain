/**
 * Live attempt evaluator. Mirrors Java Colombia.evaluateStatus() (~line 432).
 *
 * Result.color in 'yellow' | 'orange' | 'gray' | 'green'.
 * Result.isWin true iff color === 'green'.
 *
 * Java parity quirks:
 *   - For S or T-CL3, currentAttempt is the literal displayed text (concat of
 *     clickedKeys[].text). Otherwise it's combineTilesToMakeWord(tilesInBuiltWord).
 *   - Default color for non-win is gray (#A9A9A9 with black text).
 *   - Yellow/orange path only enters when correctString.length > currentAttempt.length
 *     AND (currentAttempt is a prefix of correctString OR clickedKeys.equals(firstNCorrectTiles)).
 *   - For CL1/CL2/CL4 or any S: if any clickedKeys[i].text differs from
 *     parsedRefWord*[i].text → orange; else yellow.
 *   - For T-CL3: always yellow on the prefix path (Java line 491 "AGH: unclear why CL=3 is excluded").
 *   - Overlong attempts fall through to gray.
 */
import type { ParsedTile, ScriptType, TileEntry } from '@shared/util-phoneme';
import { combineTilesToMakeWord, standardizeWordSequence } from '@shared/util-phoneme';
import type { ChallengeLevel, ColombiaVariant, WordPiece, AttemptStatus } from './types';
import type { SyllableRow } from './drawSyllableDistractor';

export type EvaluateStatusArgs = {
  level: ChallengeLevel;
  variant: ColombiaVariant;
  clickedKeys: WordPiece[];
  /** Only used for T-CL1/2/4 to recombine the typed text. */
  tilesInBuiltWord: ParsedTile[];
  parsedTiles: ParsedTile[];
  parsedSyllables: SyllableRow[];
  /** Used for combineTilesToMakeWord and standardizeWordSequence. */
  refWord: { wordInLOP: string; mixedDefs: string };
  tiles: TileEntry[];
  scriptType: ScriptType;
  placeholderCharacter: string;
};

export type EvaluateStatusResult = {
  color: AttemptStatus;
  isWin: boolean;
  /** The currentAttempt string (useful for the displayed text in T-CL1/2/4). */
  attemptText: string;
  /** The correct standardized string. */
  correctText: string;
};

export function evaluateStatus(args: EvaluateStatusArgs): EvaluateStatusResult {
  const {
    level, variant, clickedKeys, tilesInBuiltWord,
    parsedTiles, parsedSyllables,
    refWord, tiles, scriptType, placeholderCharacter,
  } = args;

  const correctText = standardizeWordSequence(
    {
      wordInLOP: refWord.wordInLOP,
      mixedDefs: refWord.mixedDefs,
      tiles,
      scriptType,
      placeholderCharacter,
    },
    scriptType,
  );

  const useDisplayedText = variant === 'S' || (variant === 'T' && level === 3);

  const attemptText = useDisplayedText
    ? clickedKeys.map((k) => k.text).join('')
    : combineTilesToMakeWord(tilesInBuiltWord, refWord.wordInLOP, -1, scriptType);

  if (attemptText === correctText) {
    return { color: 'green', isWin: true, attemptText, correctText };
  }

  if (correctText.length > attemptText.length) {
    const firstN: WordPiece[] = [];
    for (let i = 0; i < clickedKeys.length; i++) {
      if (variant === 'S') {
        if (i < parsedSyllables.length) {
          firstN.push({ text: parsedSyllables[i].syllable });
        }
      } else {
        if (i < parsedTiles.length) {
          firstN.push({ text: parsedTiles[i].base });
        }
      }
    }

    const textIsPrefix =
      attemptText === correctText.substring(0, attemptText.length);
    const tilesEqualFirstN =
      clickedKeys.length === firstN.length &&
      clickedKeys.every((k, i) => k.text === firstN[i].text);

    if (textIsPrefix || tilesEqualFirstN) {
      if (level === 1 || level === 2 || level === 4 || variant === 'S') {
        let orange = false;
        for (let i = 0; i < clickedKeys.length; i++) {
          if (variant === 'S') {
            if (i >= parsedSyllables.length) {
              orange = true;
              break;
            }
            if (clickedKeys[i].text !== parsedSyllables[i].syllable) {
              orange = true;
              break;
            }
          } else {
            if (i >= parsedTiles.length) {
              orange = true;
              break;
            }
            if (clickedKeys[i].text !== parsedTiles[i].base) {
              orange = true;
              break;
            }
          }
        }
        return {
          color: orange ? 'orange' : 'yellow',
          isWin: false,
          attemptText,
          correctText,
        };
      }
      // T-CL3: yellow on prefix path.
      return { color: 'yellow', isWin: false, attemptText, correctText };
    }
  }

  return { color: 'gray', isWin: false, attemptText, correctText };
}
