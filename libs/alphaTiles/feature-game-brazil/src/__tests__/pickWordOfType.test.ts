import { pickWordOfType, wordHasRequiredType } from '../pickWordOfType';
import type { ParsedTile } from '@shared/util-phoneme';

function tile(base: string, typeOfThisTileInstance: string): ParsedTile {
  return {
    base,
    typeOfThisTileInstance,
    stageOfFirstAppearanceForThisTileType: 1,
    audioForThisTileType: '',
    tileType: typeOfThisTileInstance,
    tileTypeB: 'none',
    tileTypeC: 'none',
  };
}

describe('wordHasRequiredType', () => {
  it('detects vowel by sub-types LV/AV/BV/FV/V', () => {
    expect(wordHasRequiredType([tile('a', 'AV'), tile('k', 'C')], 'vowel')).toBe(true);
    expect(wordHasRequiredType([tile('k', 'C'), tile('m', 'C')], 'vowel')).toBe(false);
  });

  it('detects consonant by type === C', () => {
    expect(wordHasRequiredType([tile('a', 'V'), tile('k', 'C')], 'consonant')).toBe(true);
    expect(wordHasRequiredType([tile('a', 'V'), tile('e', 'V')], 'consonant')).toBe(false);
  });

  it('detects tone by type === T', () => {
    expect(wordHasRequiredType([tile('́', 'T')], 'tone')).toBe(true);
    expect(wordHasRequiredType([tile('a', 'V')], 'tone')).toBe(false);
  });
});

describe('pickWordOfType', () => {
  it('returns the first word whose parse satisfies required type', () => {
    const words = ['x', 'cat', 'mn'];
    let i = 0;
    const result = pickWordOfType({
      pickOne: () => words[i++],
      parse: (w: string) =>
        w === 'x' ? null : Array.from(w).map((c) => tile(c, 'aeiou'.includes(c) ? 'V' : 'C')),
      required: 'vowel',
    });
    if (result === null) throw new Error('expected non-null');
    expect(result.word).toBe('cat');
  });

  it('returns null after maxAttempts when no candidate satisfies', () => {
    const result = pickWordOfType({
      pickOne: () => 'mn',
      parse: () => [tile('m', 'C'), tile('n', 'C')],
      required: 'tone',
      maxAttempts: 5,
    });
    expect(result).toBeNull();
  });

  it('skips words whose parse returns null', () => {
    let i = 0;
    const result = pickWordOfType({
      pickOne: () => i++,
      parse: (n: number) => (n < 2 ? null : [tile('a', 'V')]),
      required: 'vowel',
    });
    if (result === null) throw new Error('expected non-null');
    expect(result.word).toBe(2);
  });
});
