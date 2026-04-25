import { chilePreProcess } from '../chilePreProcess';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function makeTile(base: string) {
  return {
    base,
    alt1: '',
    alt2: '',
    alt3: '',
    type: 'C',
    audioName: '',
    upper: '',
    tileTypeB: 'none',
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

function makeWord(id: string, lop: string) {
  return { wordInLWC: id, wordInLOP: lop, duration: 0, mixedDefs: '', stageOfFirstAppearance: '1' };
}

function makeAssets(
  tileBases: string[],
  words: Array<{ id: string; lop: string }>,
  settingsOverrides: Record<string, number> = {},
): LangAssets {
  return {
    code: 'tst',
    langInfo: {
      entries: [],
      find: (label: string) => {
        if (label === 'Placeholder character') return '◌';
        if (label === 'Script type') return 'Roman';
        return undefined;
      },
    },
    settings: {
      entries: [],
      findInt: (label: string, defaultValue: number) =>
        label in settingsOverrides ? settingsOverrides[label] : defaultValue,
      findBoolean: () => false,
      findString: () => '',
      find: () => undefined,
    },
    tiles: { headers: {} as LangAssets['tiles']['headers'], rows: tileBases.map(makeTile) },
    words: { headers: {} as LangAssets['words']['headers'], rows: words.map((w) => makeWord(w.id, w.lop)) },
    syllables: { rows: [] } as unknown as LangAssets['syllables'],
    keys: { rows: [] } as unknown as LangAssets['keys'],
    games: { rows: [] } as unknown as LangAssets['games'],
    names: { rows: [] } as unknown as LangAssets['names'],
    resources: { rows: [] } as unknown as LangAssets['resources'],
    colors: { hexByIndex: [] } as unknown as LangAssets['colors'],
    share: '',
    fonts: { primary: 0 },
    images: { icon: 0, splash: 0, avatars: [], avataricons: [], tiles: {}, words: {}, wordsAlt: {} },
    audio: { tiles: {}, words: {}, syllables: {}, instructions: {} },
    precomputes: new Map(),
  } as unknown as LangAssets;
}

describe('chilePreProcess', () => {
  it('filters words shorter than minWordLength', () => {
    const assets = makeAssets(
      ['a', 'b'],
      [
        { id: 'ab', lop: 'ab' },     // 2 tiles — below default min 3
        { id: 'abc', lop: 'abc' },   // but 'c' not in tile list, skipped
      ],
    );
    const result = chilePreProcess(assets);
    // 'ab' has 2 tiles, minWordLength=3 → filtered out
    // 'abc' has 'c' not in tiles → parse returns null → skipped
    expect(result.words).toHaveLength(0);
  });

  it('filters words longer than maxWordLength', () => {
    const assets = makeAssets(
      ['a', 'b', 'c', 'd'],
      [
        { id: 'abcd', lop: 'abcd' }, // 4 tiles
      ],
      { 'Chile maximum word length': 3 },
    );
    const result = chilePreProcess(assets);
    expect(result.words).toHaveLength(0);
  });

  it('includes words within length bounds', () => {
    const assets = makeAssets(
      ['c', 'a', 't'],
      [{ id: 'cat', lop: 'cat' }],
    );
    const result = chilePreProcess(assets);
    expect(result.words).toHaveLength(1);
    expect(result.words[0]).toEqual(['c', 'a', 't']);
  });

  it('keyboard contains unique tiles from valid words', () => {
    const assets = makeAssets(
      ['c', 'a', 't', 'd', 'o', 'g'],
      [
        { id: 'cat', lop: 'cat' },
        { id: 'dog', lop: 'dog' },
      ],
    );
    const result = chilePreProcess(assets);
    expect(result.keys).toHaveLength(6);
    expect(result.keys).toContain('c');
    expect(result.keys).toContain('a');
    expect(result.keys).toContain('t');
    expect(result.keys).toContain('d');
    expect(result.keys).toContain('o');
    expect(result.keys).toContain('g');
  });

  it('keyboard has no duplicates', () => {
    const assets = makeAssets(
      ['a', 'b', 'c'],
      [
        { id: 'abc', lop: 'abc' },
        { id: 'bca', lop: 'bca' },
      ],
    );
    const result = chilePreProcess(assets);
    const unique = new Set(result.keys);
    expect(unique.size).toBe(result.keys.length);
  });

  it('keyboard is sorted by tile list order', () => {
    // tile list order: ['z','a','m'] — expected keyboard order same
    const assets = makeAssets(
      ['z', 'a', 'm'],
      [{ id: 'zam', lop: 'zam' }],
    );
    const result = chilePreProcess(assets);
    expect(result.keys).toEqual(['z', 'a', 'm']);
  });

  it('uses default keyboardWidth=7', () => {
    const assets = makeAssets(['a', 'b', 'c'], [{ id: 'abc', lop: 'abc' }]);
    const result = chilePreProcess(assets);
    expect(result.keyboardWidth).toBe(7);
  });

  it('reads keyboardWidth from settings', () => {
    const assets = makeAssets(
      ['a', 'b', 'c'],
      [{ id: 'abc', lop: 'abc' }],
      { 'Chile keyboard width': 5 },
    );
    const result = chilePreProcess(assets);
    expect(result.keyboardWidth).toBe(5);
  });

  it('skips unparseable words', () => {
    // 'xyz' uses tiles not in tile list → parsed null → skipped
    const assets = makeAssets(
      ['a', 'b', 'c'],
      [
        { id: 'abc', lop: 'abc' },
        { id: 'xyz', lop: 'xyz' },
      ],
    );
    const result = chilePreProcess(assets);
    expect(result.words).toHaveLength(1);
  });
});
