import { WIN_SEQUENCES } from './winSequences';

/**
 * Returns the first winning sequence whose every cell is covered, or null.
 * Port of Italy.java:302 loteria().
 */
export function checkWin(covered: readonly boolean[]): readonly number[] | null {
  for (const seq of WIN_SEQUENCES) {
    if (seq.every((i) => covered[i])) return seq;
  }
  return null;
}
