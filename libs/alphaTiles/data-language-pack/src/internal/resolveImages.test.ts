import { resolveImages } from './resolveImages';
import { LangAssetsBindError } from '../LangAssetsBindError';

const baseManifestImages = {
  icon: 1,
  splash: 2,
  avatars: [10, 11, 12] as readonly number[],
  avataricons: [20, 21, 22] as readonly number[],
  tiles: {} as Record<string, number>,
  words: { act: 100, bag: 101, act2: 200 } as Record<string, number>,
};

const baseParsed = {
  tiles: { rows: [{ base: 'a' }, { base: 'b' }] },
  words: {
    rows: [{ wordInLWC: 'act' }, { wordInLWC: 'bag' }],
  },
};

describe('resolveImages', () => {
  it('passes through icon and splash', () => {
    const result = resolveImages(baseManifestImages, baseParsed);
    expect(result.icon).toBe(1);
    expect(result.splash).toBe(2);
  });

  it('passes through avatars and avataricons as arrays', () => {
    const result = resolveImages(baseManifestImages, baseParsed);
    expect(result.avatars).toEqual([10, 11, 12]);
    expect(result.avataricons).toEqual([20, 21, 22]);
  });

  it('tile glyph images are optional — empty map when absent', () => {
    const result = resolveImages(baseManifestImages, baseParsed);
    expect(result.tiles).toEqual({});
  });

  it('includes tile images keyed by tile.base when present', () => {
    const manifest = {
      ...baseManifestImages,
      tiles: { a: 50 } as Record<string, number>,
    };
    const result = resolveImages(manifest, baseParsed);
    expect(result.tiles['a']).toBe(50);
    expect('b' in result.tiles).toBe(false);
  });

  it('words keyed by wordInLWC (primary)', () => {
    const result = resolveImages(baseManifestImages, baseParsed);
    expect(result.words['act']).toBe(100);
    expect(result.words['bag']).toBe(101);
  });

  it('wordsAlt populated when <word>2 key exists', () => {
    const result = resolveImages(baseManifestImages, baseParsed);
    expect(result.wordsAlt['act']).toBe(200);
    expect('bag' in result.wordsAlt).toBe(false);
  });

  it('throws LangAssetsBindError (word-image) on missing primary word image', () => {
    const parsed = {
      ...baseParsed,
      words: { rows: [{ wordInLWC: 'missing_word' }] },
    };
    expect(() => resolveImages(baseManifestImages, parsed)).toThrow(
      LangAssetsBindError,
    );
    expect(() => resolveImages(baseManifestImages, parsed)).toThrow(
      /word-image/,
    );
    expect(() => resolveImages(baseManifestImages, parsed)).toThrow(
      /missing_word/,
    );
  });
});
