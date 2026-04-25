import { fillRandomNonVowels } from '../fillRandomNonVowels';

const tilePool = [
  { base: 'a', type: 'V' },
  { base: 'e', type: 'V' },
  { base: 'i', type: 'V' },
  { base: 'b', type: 'C' },
  { base: 'c', type: 'C' },
  { base: 'th', type: 'PC' },
  { base: 'lv', type: 'LV' }, // long-vowel — Java does NOT exclude LV
  { base: 'av', type: 'AV' }, // alt-vowel — Java does NOT exclude AV
];

describe('fillRandomNonVowels', () => {
  it('only excludes type "V" — keeps LV/AV/BV/FV in the pool', () => {
    const grid = new Array(49).fill(null);
    let i = 0;
    const filled = fillRandomNonVowels({
      grid,
      tilePool,
      rng: () => i++ / 100, // deterministic walk
    });
    expect(filled.length).toBe(49);
    // No V tiles ever picked
    filled.forEach((cell) => {
      expect(['a', 'e', 'i'].includes(cell)).toBe(false);
    });
    // LV/AV variants do appear in the pool (verify by sampling many times)
    const seen = new Set<string>();
    for (let s = 0; s < 500; s++) {
      const out = fillRandomNonVowels({
        grid: new Array(49).fill(null),
        tilePool,
        rng: () => Math.random(),
      });
      out.forEach((c) => seen.add(c));
    }
    expect(seen.has('lv')).toBe(true);
    expect(seen.has('av')).toBe(true);
  });

  it('preserves non-null cells', () => {
    const grid: (string | null)[] = new Array(49).fill(null);
    grid[0] = 'WORD';
    grid[10] = 'WORD2';
    const filled = fillRandomNonVowels({ grid, tilePool, rng: () => 0 });
    expect(filled[0]).toBe('WORD');
    expect(filled[10]).toBe('WORD2');
  });

  it('throws when the pool has no non-vowel tiles', () => {
    const allV = [{ base: 'a', type: 'V' }];
    expect(() =>
      fillRandomNonVowels({ grid: [null], tilePool: allV, rng: () => 0 }),
    ).toThrow();
  });
});
