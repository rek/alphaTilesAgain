import { resolveAudio } from './resolveAudio';
import { LangAssetsBindError } from '../LangAssetsBindError';

const baseManifestAudio = {
  tiles: { zz_a: 100, zz_b: 101 },
  words: { act: 200, bag: 201 },
  syllables: {} as Record<string, number>,
  instructions: { zzz_china: 300 },
};

const baseParsed = {
  tiles: {
    rows: [
      { base: 'a', audioName: 'zz_a' },
      { base: 'b', audioName: 'zz_b' },
    ],
  },
  words: {
    rows: [
      { wordInLWC: 'act' },
      { wordInLWC: 'bag' },
    ],
  },
  syllables: { rows: [] as Array<{ syllable: string; audioName: string }> },
  games: { rows: [{ instructionAudio: 'zzz_china' }] },
};

describe('resolveAudio', () => {
  it('keys tiles by tile.base (not audioName)', () => {
    const result = resolveAudio(baseManifestAudio, baseParsed);
    expect(result.tiles['a']).toBe(100);
    expect(result.tiles['b']).toBe(101);
    expect(result.tiles['zz_a']).toBeUndefined();
  });

  it('keys words by wordInLWC', () => {
    const result = resolveAudio(baseManifestAudio, baseParsed);
    expect(result.words['act']).toBe(200);
    expect(result.words['bag']).toBe(201);
  });

  it('keys instructions by game.instructionAudio', () => {
    const result = resolveAudio(baseManifestAudio, baseParsed);
    expect(result.instructions['zzz_china']).toBe(300);
  });

  it('skips tile with zz_no_audio_needed sentinel', () => {
    const parsed = {
      ...baseParsed,
      tiles: {
        rows: [
          { base: 'a', audioName: 'zz_no_audio_needed' },
          { base: 'b', audioName: 'zz_b' },
        ],
      },
    };
    const result = resolveAudio(baseManifestAudio, parsed);
    expect('a' in result.tiles).toBe(false);
    expect(result.tiles['b']).toBe(101);
  });

  it('skips naWhileMPOnly instruction audio token', () => {
    const parsed = {
      ...baseParsed,
      games: { rows: [{ instructionAudio: 'naWhileMPOnly' }] },
    };
    const result = resolveAudio(
      { ...baseManifestAudio, instructions: {} },
      parsed,
    );
    expect(Object.keys(result.instructions)).toHaveLength(0);
  });

  it('deduplicates instruction audio keys across multiple games', () => {
    const parsed = {
      ...baseParsed,
      games: {
        rows: [
          { instructionAudio: 'zzz_china' },
          { instructionAudio: 'zzz_china' },
        ],
      },
    };
    const result = resolveAudio(baseManifestAudio, parsed);
    expect(Object.keys(result.instructions)).toHaveLength(1);
  });

  it('throws LangAssetsBindError (tile-audio) on missing tile audio', () => {
    const parsed = {
      ...baseParsed,
      tiles: { rows: [{ base: 'x', audioName: 'zz_missing' }] },
    };
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      LangAssetsBindError,
    );
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      /tile-audio/,
    );
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      /zz_missing/,
    );
  });

  it('throws LangAssetsBindError (word-audio) on missing word audio', () => {
    const parsed = {
      ...baseParsed,
      words: { rows: [{ wordInLWC: 'missing_word' }] },
    };
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      LangAssetsBindError,
    );
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      /word-audio/,
    );
  });

  it('includes syllables keyed by syllable.syllable', () => {
    const parsed = {
      ...baseParsed,
      syllables: {
        rows: [{ syllable: 'ta', audioName: 'zz_ta' }],
      },
    };
    const audio = {
      ...baseManifestAudio,
      syllables: { zz_ta: 400 },
    };
    const result = resolveAudio(audio, parsed);
    expect(result.syllables['ta']).toBe(400);
  });

  it('throws LangAssetsBindError (syllable-audio) on missing syllable audio', () => {
    const parsed = {
      ...baseParsed,
      syllables: { rows: [{ syllable: 'ta', audioName: 'zz_missing_syll' }] },
    };
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(/syllable-audio/);
  });

  it('throws LangAssetsBindError (instruction-audio) on missing instruction audio', () => {
    const parsed = {
      ...baseParsed,
      games: { rows: [{ instructionAudio: 'zzz_missing_instr' }] },
    };
    expect(() => resolveAudio(baseManifestAudio, parsed)).toThrow(
      /instruction-audio/,
    );
  });
});
