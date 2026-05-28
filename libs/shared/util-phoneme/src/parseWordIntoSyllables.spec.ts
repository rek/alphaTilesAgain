import { parseWordIntoSyllables } from './parseWordIntoSyllables';

function makeSyllable(syllable: string) {
  return { syllable };
}

describe('parseWordIntoSyllables', () => {
  it('returns longest-prefix matches in order (Roman)', () => {
    const syllables = ['sa', 'ka', 'lo', 'mi'].map(makeSyllable);
    const out = parseWordIntoSyllables('sakalo', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['sa', 'ka', 'lo']);
  });

  it('returns [] when word cannot be fully parsed', () => {
    const syllables = ['sa', 'ka'].map(makeSyllable);
    const out = parseWordIntoSyllables('xyz', syllables);
    expect(out).toEqual([]);
  });

  it('strips # and . instruction characters before matching', () => {
    const syllables = ['sa', 'ka'].map(makeSyllable);
    const out = parseWordIntoSyllables('sa.ka', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['sa', 'ka']);
  });

  it('decomposes the yue composite 二十', () => {
    const syllables = ['二', '十', '三', '百', '零'].map(makeSyllable);
    const out = parseWordIntoSyllables('二十', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['二', '十']);
  });

  it('decomposes the formal four-character yue composite 二百零三', () => {
    const syllables = ['二', '百', '零', '三'].map(makeSyllable);
    const out = parseWordIntoSyllables('二百零三', syllables);
    expect(out.map((s) => s.syllable)).toEqual(['二', '百', '零', '三']);
  });

  it('returns [] for a composite containing an unknown character', () => {
    const syllables = ['二', '十'].map(makeSyllable);
    const out = parseWordIntoSyllables('未知', syllables);
    expect(out).toEqual([]);
  });

  it('returns [] for an empty syllable list', () => {
    const out = parseWordIntoSyllables('二十', []);
    expect(out).toEqual([]);
  });

  it('preserves caller-extended row shape (generic)', () => {
    const syllables = [
      { syllable: '二', duration: 940, color: '9' },
      { syllable: '十', duration: 605, color: '3' },
    ];
    const out = parseWordIntoSyllables('二十', syllables);
    expect(out).toEqual([
      { syllable: '二', duration: 940, color: '9' },
      { syllable: '十', duration: 605, color: '3' },
    ]);
  });
});
