import { buildSyllableChoicesHard } from '../buildSyllableChoicesHard';
import { makeSyllable } from './testFixtures';

describe('buildSyllableChoicesHard', () => {
  const pool = ['ba', 'be', 'bi', 'ka', 'ke', 'ki', 'ma', 'me'].map((s) =>
    makeSyllable(s),
  );

  it('first 4 entries are correct + 3 distractors', () => {
    const out = buildSyllableChoicesHard({
      visibleGameButtons: 6,
      syllablePool: pool,
      correctText: 'ba',
      distractors: ['da', 'ga', 'la'],
    });
    expect(out.slice(0, 4)).toEqual(['ba', 'da', 'ga', 'la']);
  });

  it('Pass A picks same first+second char before falling back', () => {
    const out = buildSyllableChoicesHard({
      visibleGameButtons: 6,
      syllablePool: pool,
      correctText: 'ba',
      distractors: ['', '', ''], // all empty so trio shrinks set to {ba}
    });
    // be, bi share first char 'b' with 'ba' (length>=2 paths).
    // 'be' & 'bi' should fill before 'ka', 'ke', 'ki'.
    expect(out.includes('be')).toBe(true);
    expect(out.includes('bi')).toBe(true);
  });

  it('handles correct length < 2 (single-char prefix branch)', () => {
    const single = ['b', 'c', 'd', 'e', 'f', 'g'].map((s) => makeSyllable(s));
    const out = buildSyllableChoicesHard({
      visibleGameButtons: 4,
      syllablePool: single,
      correctText: 'b',
      distractors: ['', '', ''],
    });
    expect(out[0]).toBe('b');
    expect(out).toHaveLength(4);
  });
});
