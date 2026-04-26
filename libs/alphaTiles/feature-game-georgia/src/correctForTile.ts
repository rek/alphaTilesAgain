/**
 * Derive the "correct" tile for the prompt word per CL band.
 *
 * Java reference: Georgia.java ~173–195 (`setWord()`).
 *
 * - CL 1–6: parsedTiles[0].
 * - CL 7–12: walk past leading LV tiles; first non-LV is the candidate.
 *   If candidate's type is PC, use the most-recent LV (initialLV) when
 *   non-null, else parsedTiles[t+1] (which would IOB on a 1-tile word; Java
 *   doesn't guard, in practice the CorV filter discards such words).
 */
import type { ParsedTile } from '@shared/util-phoneme';

export function correctForTile(
  parsed: ParsedTile[],
  level: number,
): ParsedTile {
  if (level <= 6) return parsed[0];

  let t = 0;
  let initialTile = parsed[0];
  let initialLV: ParsedTile | null = null;
  while (
    initialTile.typeOfThisTileInstance === 'LV' &&
    t < parsed.length - 1
  ) {
    initialLV = initialTile;
    t++;
    initialTile = parsed[t];
  }
  if (
    initialTile.typeOfThisTileInstance === 'PC' &&
    t < parsed.length
  ) {
    if (initialLV !== null) return initialLV;
    return parsed[t + 1];
  }
  return initialTile;
}
