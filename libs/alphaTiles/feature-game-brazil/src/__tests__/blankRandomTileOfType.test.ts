import { blankRandomTileOfType } from '../blankRandomTileOfType';
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

const seq = (...vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

function unwrap<T>(v: T | null): T {
  if (v === null) throw new Error('expected non-null');
  return v;
}

describe('blankRandomTileOfType', () => {
  it('blanks a vowel and returns it as correct', () => {
    const parsed = [tile('c', 'C'), tile('a', 'V'), tile('t', 'C')];
    const result = unwrap(blankRandomTileOfType(parsed, 'vowel', 'Roman', '◌', () => 0));
    expect(result.correct.base).toBe('a');
    expect(result.display[1].text).toBe('__');
    expect(result.display[1].isBlank).toBe(true);
  });

  it('skips SAD tiles even if they match required type', () => {
    const parsed = [tile('a', 'SAD'), tile('e', 'V')];
    const result = unwrap(blankRandomTileOfType(parsed, 'vowel', 'Roman', '◌', () => 0));
    expect(result.correct.base).toBe('e');
  });

  it('returns null when no candidate of required type exists', () => {
    const parsed = [tile('c', 'C'), tile('t', 'C')];
    const result = blankRandomTileOfType(parsed, 'tone', 'Roman', '◌');
    expect(result).toBeNull();
  });

  it('uses placeholderCharacter for Thai consonant blanks', () => {
    const parsed = [tile('k', 'C'), tile('a', 'V')];
    const result = unwrap(blankRandomTileOfType(parsed, 'consonant', 'Thai', '◌', () => 0));
    expect(result.display[0].text).toBe('◌');
  });

  it('uses zero-width space for Khmer consonant when next is vowel', () => {
    const parsed = [tile('k', 'C'), tile('a', 'V')];
    const result = unwrap(blankRandomTileOfType(parsed, 'consonant', 'Khmer', '◌', () => 0));
    expect(result.display[0].text).toBe('​'); // U+200B
  });

  it('uses placeholderCharacter for Khmer consonant when next is non-vowel', () => {
    const parsed = [tile('k', 'C'), tile('m', 'C')];
    const result = unwrap(blankRandomTileOfType(parsed, 'consonant', 'Khmer', '◌', () => 0));
    expect(result.display[0].text).toBe('◌');
  });

  it('uses __ for Roman script regardless of tile type', () => {
    const parsed = [tile('k', 'C'), tile('a', 'V')];
    const result = unwrap(blankRandomTileOfType(parsed, 'consonant', 'Roman', '◌', () => 0));
    expect(result.display[0].text).toBe('__');
  });

  it('picks among multiple candidates deterministically with rng', () => {
    const parsed = [tile('a', 'V'), tile('e', 'V'), tile('i', 'V')];
    const r1 = unwrap(blankRandomTileOfType(parsed, 'vowel', 'Roman', '◌', () => 0));
    const r2 = unwrap(blankRandomTileOfType(parsed, 'vowel', 'Roman', '◌', seq(0.99)));
    expect(r1.correct.base).toBe('a');
    expect(r2.correct.base).toBe('i');
  });
});
