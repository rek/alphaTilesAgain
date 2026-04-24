import { buildChinaData } from '../buildChinaData';
import type { LangAssets } from '@alphaTiles/data-language-assets';

function makeTile(base: string) {
  return {
    base, alt1: '', alt2: '', alt3: '', type: 'C', audioName: '',
    tileTypeB: 'none', audioNameB: '', tileTypeC: 'none',
    audioNameC: '',
    stageOfFirstAppearance: 1, stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeWord(id: string, lop: string) {
  return { wordInLWC: id, wordInLOP: lop, duration: 0, mixedDefs: '', stageOfFirstAppearance: '1' };
}

// Minimal LangAssets fixture
function makeAssets(tileBasesAvailable: string[], words: Array<{ id: string; lop: string }>): LangAssets {
  return {
    code: 'tst',
    langInfo: {
      entries: [],
      find: (label: string) => label === 'Placeholder character' ? '◌' : undefined,
    },
    settings: { entries: [], findInt: () => 0, findBoolean: () => false, findString: () => '' } as unknown as LangAssets['settings'],
    tiles: { headers: {} as LangAssets['tiles']['headers'], rows: tileBasesAvailable.map(makeTile) },
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

describe('buildChinaData', () => {
  it('buckets 3-tile words correctly', () => {
    const assets = makeAssets(
      ['c', 'a', 't', 'f', 'i', 's', 'h'],
      [
        { id: 'cat', lop: 'cat' },   // 3 tiles
        { id: 'fish', lop: 'fish' },  // 4 tiles
        { id: 'at', lop: 'at' },      // 2 tiles — excluded
      ],
    );
    const result = buildChinaData(assets);
    expect(result.threeTileWords.map((w) => w.wordInLWC)).toEqual(['cat']);
    expect(result.fourTileWords.map((w) => w.wordInLWC)).toEqual(['fish']);
  });

  it('words with unparseable tiles are excluded', () => {
    const assets = makeAssets(
      ['a', 'b', 'c'],
      [
        { id: 'xyz', lop: 'xyz' }, // 'x', 'y', 'z' not in tile list → null parse
        { id: 'abc', lop: 'abc' }, // 3 tiles
      ],
    );
    const result = buildChinaData(assets);
    expect(result.threeTileWords.map((w) => w.wordInLWC)).toEqual(['abc']);
  });

  it('warns (not throws) when pools are too small', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const assets = makeAssets(['a', 'b', 'c'], [{ id: 'abc', lop: 'abc' }]);
    expect(() => buildChinaData(assets)).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('insufficient'));
    consoleSpy.mockRestore();
  });
});
