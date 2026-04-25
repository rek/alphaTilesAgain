import { shuffle } from './shuffle';

/**
 * Build a fresh Italy round. Mirrors Italy.java:194 playAgain().
 *
 * - Shuffle source list, take the first `deckSize` entries → `gameCards`.
 * - First `boardSize` entries become the board (kept in that order).
 * - The full `deckSize` slice is re-shuffled to form the caller deck.
 *
 * If `source.length < deckSize` returns `{ error: 'insufficient-content' }`
 * so the caller can navigate back to the country menu (Italy.java:204-211).
 */
export type ItalySetupResult<T> =
  | { board: T[]; deck: T[] }
  | { error: 'insufficient-content' };

export function setupRound<T>(
  source: readonly T[],
  deckSize: number,
  boardSize: number,
  rng: () => number = Math.random,
): ItalySetupResult<T> {
  if (source.length < deckSize) return { error: 'insufficient-content' };

  const initial = shuffle(source, rng).slice(0, deckSize);
  const board = initial.slice(0, boardSize);
  const deck = shuffle(initial, rng);
  return { board, deck };
}
