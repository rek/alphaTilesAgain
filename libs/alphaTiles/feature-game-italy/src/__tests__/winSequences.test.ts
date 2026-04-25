import { WIN_SEQUENCES } from '../winSequences';

describe('WIN_SEQUENCES', () => {
  it('has 10 entries (4 rows + 4 cols + 2 diagonals)', () => {
    expect(WIN_SEQUENCES).toHaveLength(10);
  });

  it('each entry has 4 indices', () => {
    for (const seq of WIN_SEQUENCES) expect(seq).toHaveLength(4);
  });

  it('all indices are within 0..15', () => {
    for (const seq of WIN_SEQUENCES) {
      for (const i of seq) expect(i).toBeGreaterThanOrEqual(0);
      for (const i of seq) expect(i).toBeLessThanOrEqual(15);
    }
  });

  it('encodes the diagonals 0/5/10/15 and 3/6/9/12', () => {
    expect(WIN_SEQUENCES).toContainEqual([0, 5, 10, 15]);
    expect(WIN_SEQUENCES).toContainEqual([3, 6, 9, 12]);
  });
});
