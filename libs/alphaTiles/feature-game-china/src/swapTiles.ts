/**
 * Port of China.java swapTiles — immutable board version.
 * Returns a new board with indexA and indexB swapped, plus the new blankIndex.
 */
export function swapTiles(
  board: string[],
  indexA: number,
  indexB: number,
): { board: string[]; blankIndex: number } {
  const next = [...board];
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  const blankIndex = next[indexA] === '' ? indexA : indexB;
  return { board: next, blankIndex };
}
