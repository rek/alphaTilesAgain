import { registerScriptParser, getParser } from '../scriptRegistry';
import type { ScriptParser } from '../scriptRegistry';
import { combineTilesToMakeWord } from '../combineTilesToMakeWord';
import { standardizeWordSequence } from '../standardizeWordSequence';
import { buildTileHashMap } from '../buildTileHashMap';
import type { TileEntry, ParsedTile } from '../TileEntry';

// --- minimal fixtures ---

function makeTileEntry(base: string, type = 'C'): TileEntry {
  return {
    base, alt1: '', alt2: '', alt3: '',
    type, tileTypeB: 'none', tileTypeC: 'none',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
    audioName: base, audioNameB: '', audioNameC: '',
  };
}

const ENG_TILES: TileEntry[] = [
  makeTileEntry('c'), makeTileEntry('a', 'V'), makeTileEntry('t'),
  makeTileEntry('ch'), makeTileEntry('h'),
];

const baseOpts = {
  tiles: ENG_TILES,
  mixedDefs: '',
  scriptType: 'Roman' as const,
  placeholderCharacter: '◌',
};

function parsed(base: string): ParsedTile {
  return {
    base,
    typeOfThisTileInstance: 'C',
    stageOfFirstAppearanceForThisTileType: 1,
    audioForThisTileType: base,
    tileType: 'C', tileTypeB: 'none', tileTypeC: 'none',
  };
}

// --- registerScriptParser ---

describe('registerScriptParser', () => {
  it('throws on duplicate key', () => {
    expect(() =>
      registerScriptParser('default', {} as ScriptParser),
    ).toThrow("parser already registered for scriptType 'default'");
  });

  it('registers and dispatches to a new parser', () => {
    const fakeParser: ScriptParser = {
      parse: () => [parsed('X')],
      combine: () => 'FAKE',
      standardizeSequence: () => 'FAKE_STD',
    };

    registerScriptParser('__test_fake__', fakeParser);

    const result = combineTilesToMakeWord([], 'anything', -1, '__test_fake__');
    expect(result).toBe('FAKE');
  });
});

// --- unknown script fallback ---

describe('unknown script fallback', () => {
  it('falls back to default with a console.warn', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    combineTilesToMakeWord([parsed('a')], 'a', -1, '__unregistered__');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('__unregistered__'),
    );
    warnSpy.mockRestore();
  });
});

// --- combineTilesToMakeWord (default parser) ---

describe('combineTilesToMakeWord default', () => {
  it('joins tile bases left-to-right', () => {
    const tiles = [parsed('c'), parsed('a'), parsed('t')];
    expect(combineTilesToMakeWord(tiles, 'cat', -1)).toBe('cat');
  });

  it('empty tiles returns empty string', () => {
    expect(combineTilesToMakeWord([], '', -1)).toBe('');
  });
});

// --- standardizeWordSequence (default parser) ---

describe('standardizeWordSequence default', () => {
  it('round-trips a simple Roman word', () => {
    const result = standardizeWordSequence({ ...baseOpts, wordInLOP: 'cat' });
    // parse 'cat' → [c,a,t], combine → 'cat'
    expect(result).toBe('cat');
  });

  it('longest-match: ch before c+h', () => {
    const result = standardizeWordSequence({ ...baseOpts, wordInLOP: 'chat' });
    // 'ch' is a tile, so parse → [ch,a,t], combine → 'chat'
    expect(result).toBe('chat');
  });

  it('returns wordInLOP unchanged when parse fails', () => {
    const result = standardizeWordSequence({ ...baseOpts, wordInLOP: 'xyz' });
    expect(result).toBe('xyz');
  });
});
