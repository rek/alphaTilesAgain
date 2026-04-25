import { buildWrongCL2 } from '../buildWrongCL2';
import { makeTile, makeParsed, seededRng } from './testFixtures';

describe('buildWrongCL2', () => {
  // word "cat" → ['c'(C), 'a'(V), 't'(C)]
  // span = len - 1 = 2 → idx ∈ {0, 1}; t (last tile) is NEVER replaced (Java parity)
  const parsed = [makeParsed('c', 'C'), makeParsed('a', 'V'), makeParsed('t', 'C')];
  const pools = {
    V: [makeTile('e', 'V'), makeTile('i', 'V'), makeTile('o', 'V')],
    C: [makeTile('b', 'C'), makeTile('d', 'C'), makeTile('f', 'C'), makeTile('g', 'C')],
    T: [],
    AD: [],
  };

  it('produces a candidate that differs from correct in exactly one tile (idx 0 or 1)', () => {
    const rng = seededRng(42);
    const text = buildWrongCL2({
      parsed, pools, prior: [], correct: 'cat',
      wordInLOP: 'cat', scriptType: 'Roman', rng,
    });
    expect(text).not.toBeNull();
    expect(text).not.toBe('cat');
    if (text === null) return;
    expect(text).toHaveLength(3);
    // The replaced position is 0 or 1, NOT 2 (last tile guarded by nextInt(len-1)).
    expect(text[2]).toBe('t');
    // exactly one position differs
    const diffs = ['c', 'a', 't'].reduce((n, ch, i) => n + (ch !== text[i] ? 1 : 0), 0);
    expect(diffs).toBe(1);
  });

  it('never replaces the last tile across many seeds', () => {
    for (let seed = 1; seed < 100; seed++) {
      const text = buildWrongCL2({
        parsed, pools, prior: [], correct: 'cat',
        wordInLOP: 'cat', scriptType: 'Roman', rng: seededRng(seed),
      });
      if (text !== null) expect(text[2]).toBe('t');
    }
  });

  it('returns null when same-type pool is empty for the picked index', () => {
    const text = buildWrongCL2({
      parsed: [makeParsed('@', 'AD'), makeParsed('a', 'V')],
      pools: { V: [], C: [], T: [], AD: [] },
      prior: [], correct: '@a',
      wordInLOP: '@a', scriptType: 'Roman',
    });
    expect(text).toBeNull();
  });

  it('rejects forbidden للہ substring', () => {
    const text = buildWrongCL2({
      parsed: [makeParsed('a', 'V'), makeParsed('b', 'C')],
      pools: {
        V: [makeTile('للہ', 'V'), makeTile('e', 'V'), makeTile('i', 'V')],
        C: [makeTile('للہ', 'C'), makeTile('z', 'C')],
        T: [], AD: [],
      },
      prior: [], correct: 'ab',
      wordInLOP: 'ab', scriptType: 'Roman',
    });
    if (text !== null) expect(text.includes('للہ')).toBe(false);
  });
});
