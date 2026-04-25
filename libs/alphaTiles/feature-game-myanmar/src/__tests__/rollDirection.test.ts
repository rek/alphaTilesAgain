import { rollDirection } from '../rollDirection';
import { DIRECTIONS } from '../directions';

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('rollDirection', () => {
  it('CL1 picks only indices 0 or 1 (right or down)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const r = rollDirection({ level: 1, rng: () => i / 100 });
      const idx = DIRECTIONS.findIndex((d) => d === r);
      seen.add(idx);
    }
    expect([...seen].every((i) => i === 0 || i === 1)).toBe(true);
    expect(seen.has(0)).toBe(true);
    expect(seen.has(1)).toBe(true);
  });

  it('CL2 covers indices 0..4 inclusive', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const r = rollDirection({ level: 2, rng: () => i / 200 });
      seen.add(DIRECTIONS.indexOf(r));
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('CL3 covers indices 0..7 inclusive', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 400; i++) {
      const r = rollDirection({ level: 3, rng: () => i / 400 });
      seen.add(DIRECTIONS.indexOf(r));
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('idx 4 (Java bug) carries dx=1 dy=0 — same movement as idx 1 but keypad code 9', () => {
    // Force selection of idx 4 by feeding 4/(max+1) = 0.5 with max=7
    const r = rollDirection({ level: 3, rng: seqRng([0.5]) });
    expect(r).toEqual(DIRECTIONS[4]);
    expect(r[0]).toBe(9); // keypad code
    expect(r[1]).toBe(1); // dx
    expect(r[2]).toBe(0); // dy
  });
});
