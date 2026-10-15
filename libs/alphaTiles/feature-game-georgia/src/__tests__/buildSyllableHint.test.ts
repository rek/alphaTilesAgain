import { buildSyllableHint } from '../buildSyllableHint';

describe('buildSyllableHint', () => {
  it('blanks the first syllable of a multi-syllable word', () => {
    expect(buildSyllableHint({ syllables: ['醫', '生'] })).toBe('__生');
  });

  it('keeps every later syllable', () => {
    expect(
      buildSyllableHint({ syllables: ['二', '百', '零', '三'] }),
    ).toBe('__百零三');
  });

  it('renders the placeholder alone for a single-syllable word', () => {
    expect(buildSyllableHint({ syllables: ['一'] })).toBe('__');
  });

  it('returns empty for an unparsed word', () => {
    expect(buildSyllableHint({ syllables: [] })).toBe('');
  });
});
