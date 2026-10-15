import { syllableChainFor } from './syllableChainFor';

const rows = ['二', '十', '百', '零', '三'].map((syllable) => ({ syllable }));

describe('syllableChainFor', () => {
  it('returns the parts when every part has a clip', () => {
    const out = syllableChainFor('二百零三', rows, () => true);
    expect(out.map((s) => s.syllable)).toEqual(['二', '百', '零', '三']);
  });

  it('is empty when any part lacks a clip', () => {
    expect(syllableChainFor('二十', rows, (s) => s.syllable !== '十')).toEqual([]);
  });

  it('is empty when the word does not parse', () => {
    expect(syllableChainFor('萬', rows, () => true)).toEqual([]);
  });

  it('is empty for an empty LOP', () => {
    expect(syllableChainFor('', rows, () => true)).toEqual([]);
  });
});
