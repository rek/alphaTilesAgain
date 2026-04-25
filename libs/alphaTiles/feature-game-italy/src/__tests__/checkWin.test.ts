import { checkWin } from '../checkWin';
import { WIN_SEQUENCES } from '../winSequences';

function coveredFrom(indices: readonly number[]): boolean[] {
  const arr = new Array(16).fill(false);
  for (const i of indices) arr[i] = true;
  return arr;
}

describe('checkWin', () => {
  it('returns null when no sequence is fully covered', () => {
    expect(checkWin(new Array(16).fill(false))).toBeNull();
    expect(checkWin(coveredFrom([0, 1, 2]))).toBeNull(); // partial row
    expect(checkWin(coveredFrom([0, 5, 10]))).toBeNull(); // partial diagonal
  });

  it('detects each of the 10 winning sequences in isolation', () => {
    for (const seq of WIN_SEQUENCES) {
      const result = checkWin(coveredFrom(seq));
      expect(result).toEqual(seq);
    }
  });

  it('returns the first matching sequence when multiple match', () => {
    // Top row + left column both complete — top row is first in WIN_SEQUENCES
    const covered = coveredFrom([0, 1, 2, 3, 4, 8, 12]);
    expect(checkWin(covered)).toEqual([0, 1, 2, 3]);
  });

  it('detects a full board as a win (top row resolves first)', () => {
    const covered = new Array(16).fill(true);
    expect(checkWin(covered)).toEqual([0, 1, 2, 3]);
  });
});
