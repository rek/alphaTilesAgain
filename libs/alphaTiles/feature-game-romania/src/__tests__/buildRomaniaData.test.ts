import { buildRomaniaData } from '../buildRomaniaData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function makeTile(base: string) {
  return {
    base, alt1: '', alt2: '', alt3: '', type: 'C', audioName: '',
    tileTypeB: 'none', audioNameB: '', tileTypeC: 'none', audioNameC: '',
    stageOfFirstAppearance: 1, stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeWord(id: string, lop: string) {
  return { wordInLWC: id, wordInLOP: lop, duration: 0, mixedDefs: '', stageOfFirstAppearance: '1' };
}

function makeAssets(tileBases: string[], words: Array<{ id: string; lop: string }>): LangAssets {
  return {
    code: 'tst',
    langInfo: {
      entries: [],
      find: (label: string) => label === 'Placeholder character' ? '◌' : undefined,
    },
    settings: { entries: [], findInt: () => 0, findBoolean: () => false, findString: () => '' } as unknown as LangAssets['settings'],
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

describe('buildRomaniaData', () => {
  it('indexes a word under each of its tiles', () => {
    const assets = makeAssets(
      ['c', 'a', 't'],
      [{ id: 'cat', lop: 'cat' }],
    );
    const result = buildRomaniaData(assets);
    expect(result['c']?.map((w) => w.wordInLWC)).toContain('cat');
    expect(result['a']?.map((w) => w.wordInLWC)).toContain('cat');
    expect(result['t']?.map((w) => w.wordInLWC)).toContain('cat');
  });

  it('does not duplicate a word under the same tile key', () => {
    // 'cacao' has 'c' at position 0 and 2 — should only appear once under 'c'
    const assets = makeAssets(
      ['c', 'a', 'o'],
      [{ id: 'cacao', lop: 'cacao' }],
    );
    const result = buildRomaniaData(assets);
    const cWords = result['c'] ?? [];
    expect(cWords.filter((w) => w.wordInLWC === 'cacao').length).toBe(1);
  });

  it('skips words that cannot be parsed', () => {
    const assets = makeAssets(
      ['a', 'b'],
      [
        { id: 'ab', lop: 'ab' },
        { id: 'xyz', lop: 'xyz' }, // 'x','y','z' not in tile list
      ],
    );
    const result = buildRomaniaData(assets);
    expect(result['a']?.map((w) => w.wordInLWC)).toEqual(['ab']);
    expect(result['x']).toBeUndefined();
  });
});
