/**
 * Update keyboard tile colors based on new guess results.
 *
 * Port of Chile.java completeWord() keyboard update loop (lines 250–258):
 * ```java
 * if((key.color != BLUE && key.color != GREEN) ||
 *    (key.color == BLUE && row[i].color == GREEN)) {
 *     key.color = row[i].color;
 * }
 * ```
 * Color never regresses: GRAY < BLUE < GREEN.
 * A key already GREEN stays GREEN; a key already BLUE can only advance to GREEN.
 */

import type { ColorTile, TileColor } from './evaluateGuess';

const COLOR_RANK: Record<TileColor, number> = {
  EMPTY: -1,
  KEY: 0,
  GRAY: 1,
  BLUE: 2,
  GREEN: 3,
  REVEAL: 3,
};

/**
 * Given the current keyboard tile array and the evaluated guess row,
 * return a new keyboard array with updated colors.
 *
 * Colors never regress (lower rank → higher rank only).
 */
export function updateKeyboard(
  keyTiles: ColorTile[],
  guessResult: ColorTile[],
): ColorTile[] {
  return keyTiles.map((key) => {
    // Find matching guess tile
    const match = guessResult.find((g) => g.text === key.text);
    if (!match) return key;

    const currentRank = COLOR_RANK[key.color] ?? 0;
    const newRank = COLOR_RANK[match.color] ?? 0;
    if (newRank > currentRank) {
      return { ...key, color: match.color };
    }
    return key;
  });
}
