import { parseWordIntoSyllables } from '../parseWordIntoSyllables';
import { makeSyllable } from './testFixtures';

describe('parseWordIntoSyllables', () => {
  const syllables = ['sa', 'ka', 'lo', 'mi'].map((s) => makeSyllable(s));

  it('returns longest-prefix matches in order', () => {
    const out = parseWordIntoSyllables('sakalo', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['sa', 'ka', 'lo']);
  });

  it('returns [] when word cannot be fully parsed', () => {
    const out = parseWordIntoSyllables('xyz', syllables);
    expect(out).toEqual([]);
  });

  it('strips # and . instruction characters before matching', () => {
    const out = parseWordIntoSyllables('sa.ka', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['sa', 'ka']);
  });
});
