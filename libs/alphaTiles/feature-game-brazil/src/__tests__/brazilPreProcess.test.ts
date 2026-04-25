import { brazilPreProcess } from '../brazilPreProcess';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function makeTile(base: string, type: string, tileTypeB = 'none') {
  return {
    base,
    alt1: '',
    alt2: '',
    alt3: '',
    type,
    audioName: '',
    upper: base,
    tileTypeB,
    audioNameB: '',
    tileTypeC: 'none',
    audioNameC: '',
    iconicWord: '',
    tileColor: '',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeAssets(
  tiles: Array<{ base: string; type: string; tileTypeB?: string }>,
  syllables: string[] = [],
): LangAssets {
  return {
    code: 'tst',
    langInfo: { entries: [], find: () => undefined },
    settings: {} as LangAssets['settings'],
    tiles: { headers: {} as LangAssets['tiles']['headers'], rows: tiles.map((t) => makeTile(t.base, t.type, t.tileTypeB)) },
    words: { headers: {} as LangAssets['words']['headers'], rows: [] },
    syllables: { rows: syllables.map((s) => ({ syllable: s, distractors: ['', '', ''] as [string, string, string], audioName: '', duration: 0, color: '' })) },
    keys: {} as LangAssets['keys'],
    games: {} as LangAssets['games'],
    names: {} as LangAssets['names'],
    resources: {} as LangAssets['resources'],
    colors: {} as LangAssets['colors'],
    share: '',
    fonts: { primary: 0 },
    images: { icon: 0, splash: 0, avatars: [], avataricons: [], tiles: {}, words: {}, wordsAlt: {} },
    audio: { tiles: {}, words: {}, syllables: {}, instructions: {} },
    precomputes: new Map(),
  } as unknown as LangAssets;
}

describe('brazilPreProcess', () => {
  it('buckets vowels by all vowel sub-types (LV/AV/BV/FV/V)', () => {
    const assets = makeAssets([
      { base: 'a', type: 'V' },
      { base: 'e', type: 'LV' },
      { base: 'i', type: 'AV' },
      { base: 'o', type: 'BV' },
      { base: 'u', type: 'FV' },
      { base: 'k', type: 'C' },
    ]);
    const result = brazilPreProcess(assets);
    expect(result.vowels.map((t) => t.base).sort()).toEqual(['a', 'e', 'i', 'o', 'u']);
  });

  it('buckets consonants by type === C only', () => {
    const assets = makeAssets([
      { base: 'k', type: 'C' },
      { base: 'g', type: 'C' },
      { base: 'a', type: 'V' },
      { base: 'p', type: 'PC' },
    ]);
    const result = brazilPreProcess(assets);
    expect(result.consonants.map((t) => t.base).sort()).toEqual(['g', 'k']);
  });

  it('buckets tones by type === T', () => {
    const assets = makeAssets([
      { base: '́', type: 'T' },
      { base: '̀', type: 'T' },
      { base: 'k', type: 'C' },
    ]);
    const result = brazilPreProcess(assets);
    expect(result.tones).toHaveLength(2);
  });

  it('detects multitype tiles by tileTypeB !== "none"', () => {
    const assets = makeAssets([
      { base: 'a', type: 'V', tileTypeB: 'C' },
      { base: 'b', type: 'C', tileTypeB: 'none' },
      { base: 'c', type: 'V', tileTypeB: 'V' },
    ]);
    const result = brazilPreProcess(assets);
    expect(result.multitypeTiles.sort()).toEqual(['a', 'c']);
  });

  it('extracts syllables as plain strings', () => {
    const assets = makeAssets([{ base: 'k', type: 'C' }], ['ka', 'ki', 'ko']);
    const result = brazilPreProcess(assets);
    expect(result.syllables).toEqual(['ka', 'ki', 'ko']);
  });

  it('returns empty pools when tiles list is empty', () => {
    const assets = makeAssets([]);
    const result = brazilPreProcess(assets);
    expect(result.vowels).toEqual([]);
    expect(result.consonants).toEqual([]);
    expect(result.tones).toEqual([]);
    expect(result.multitypeTiles).toEqual([]);
    expect(result.syllables).toEqual([]);
  });
});
