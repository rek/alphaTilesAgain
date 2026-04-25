/**
 * 10 winning sequences on a 4×4 board (row-major indices 0..15).
 * Port of Italy.java:45 LOTERIA_SEQUENCES (1-based) → 0-based.
 */
export const WIN_SEQUENCES: readonly (readonly number[])[] = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
] as const;
