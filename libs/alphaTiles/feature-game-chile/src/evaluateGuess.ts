/**
 * Evaluate a guess against the secret word, returning a colored tile array.
 *
 * Port of Chile.java completeWord() evaluation loop (lines 189–231).
 *
 * Algorithm:
 * 1. First pass (by secret index i):
 *    - If guess[i] === secret[i]: exact match → GREEN (correct[i]=1).
 *    - Else: search guess for position x where guess[x]===secret[i]
 *      AND guess[x]!==secret[x] (x not an exact match)
 *      AND frontCor[i] not yet set AND correct[x]===0
 *      → mark guess position x as BLUE (correct[x]=2), set frontCor[i]=true.
 * 2. Remaining (correct[i]===0) → GRAY.
 *
 * Color index constants from aa_colors.txt (Java Start.colorList):
 *   GREEN = index 3, BLUE = index 1, GRAY = index 8.
 */

export type TileColor = 'GREEN' | 'BLUE' | 'GRAY' | 'EMPTY' | 'KEY' | 'REVEAL';

export type ColorTile = {
  text: string;
  color: TileColor;
};

export function evaluateGuess(guess: string[], secret: string[]): ColorTile[] {
  const correct = new Array<number>(secret.length).fill(0);
  const frontCor = new Array<boolean>(secret.length).fill(false);

  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      frontCor[i] = true;
      correct[i] = 1;
    } else {
      for (let x = 0; x < guess.length; x++) {
        if (
          guess[x] === secret[i] &&
          guess[x] !== secret[x] &&
          !frontCor[i] &&
          correct[x] === 0
        ) {
          frontCor[i] = true;
          correct[x] = 2;
          break;
        }
      }
    }
  }

  const result: ColorTile[] = guess.map((text, i) => {
    let color: TileColor;
    if (correct[i] === 1) color = 'GREEN';
    else if (correct[i] === 2) color = 'BLUE';
    else color = 'GRAY';
    return { text, color };
  });

  return result;
}

/** Returns the number of GREEN tiles in an evaluated guess result. */
export function countGreens(tiles: ColorTile[]): number {
  return tiles.filter((t) => t.color === 'GREEN').length;
}
