/**
 * Tests for loadLangPack.
 * Uses synthetic manifests — no actual file IO.
 *
 * Covers: happy path, missing audio, sentinel handling, parse error propagation,
 * registered precompute result in assets.precomputes.
 */

import { loadLangPack } from './loadLangPack';
import { LangAssetsBindError } from './LangAssetsBindError';
import { LangPackParseError } from '@shared/util-lang-pack-parser';
import { registerPrecompute } from '@shared/util-precompute';

// ---------------------------------------------------------------------------
// Pull registry + cache so we can reset between tests
// ---------------------------------------------------------------------------

const { registry, precomputeCache } = require('@shared/util-precompute/src/lib/precomputeRegistry') as {
  registry: Map<string, unknown>;
  precomputeCache: Map<string, unknown>;
};

beforeEach(() => {
  registry.clear();
  precomputeCache.clear();
});

// ---------------------------------------------------------------------------
// Minimal valid manifest fixture
// ---------------------------------------------------------------------------

const GAMETILES_SRC = [
  'tiles\tOr1\tOr2\tOr3\tType\tAudioName\tUpper\tType2\tAudioName2\tType3\tAudioName3\tPlaceholder\tPlaceholder\tPlaceholder\tFirstAppearsInStage...\tFirstAppearsInStage...(Type2)\tFirstAppearsInStage...(Type3)',
  'a\te\to\tar\tV\tzz_a\tA\tnone\tX\tnone\tX\t0\t0\t0\t-\t-\t-',
].join('\n');

const WORDLIST_SRC = [
  'EnglishLWC\tEnglishLOP\t(Placeholder. No values needed.)\tMixed-TypeSymbolsInfo\t(Placeholder. No values needed.)\tFirstAppearsInStage(IFOverrulingDefault)...',
  'act\tact\t0\t-\t0\t-',
].join('\n');

const SYLLABLES_SRC = 'Syllable\tOr1\tOr2\tOr3\tSyllableAudioName\tDuration\tColor\n';

const KEYBOARD_SRC = 'keys\ttheme_color\na\t4\n';

const GAMES_SRC = [
  'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded',
  '88\tChina\t1\t9\tzzz_china\t1999\tT\t-',
].join('\n');

const LANGINFO_SRC = [
  'Item\tAnswer',
  '1. Lang Name (In Local Lang)\tEnglish',
  '2. Lang Name (In English)\tEnglish',
  '3. Lang Name (In Reg/Ntnl Lang)\tEnglish',
  '4. Ethnologue code\teng',
  '5. Country\tUSA',
  '6. Variant info\t1',
  '7. Game Name (In Local Lang)\tAlpha Tiles',
  '8. Script direction (LTR or RTL)\tLTR',
  '9. Audio and image credits\tnone',
  '10. The word NAME in local language\tPlayer',
  '11. Script type\tRoman',
  '12. Email\ttest@example.com',
  '13. Privacy Policy\thttps://example.com',
  '14. Audio and image credits (lang 2)\tnone',
].join('\n');

const SETTINGS_SRC = [
  'Setting\tValue',
  '1. Game 001 Scan Setting\t1',
  '3. Has tile audio\tTRUE',
  '5. Has syllable audio\tFALSE',
].join('\n');

const NAMES_SRC = 'Entry\tName\n';
const RESOURCES_SRC = 'Name\tLink\tImage\n';
const COLORS_SRC = 'Game Color Number\tColor Name\tHex Code\n0\tred\t#FF0000\n';
const SHARE_SRC = 'Link\nhttps://example.com/share\n';

const rawFiles: Record<string, string> = {
  aa_gametiles: GAMETILES_SRC,
  aa_wordlist: WORDLIST_SRC,
  aa_syllables: SYLLABLES_SRC,
  aa_keyboard: KEYBOARD_SRC,
  aa_games: GAMES_SRC,
  aa_langinfo: LANGINFO_SRC,
  aa_settings: SETTINGS_SRC,
  aa_names: NAMES_SRC,
  aa_resources: RESOURCES_SRC,
  aa_colors: COLORS_SRC,
  aa_share: SHARE_SRC,
};

const baseManifest = {
  code: 'eng',
  rawFiles,
  fonts: { primary: 999 },
  images: {
    icon: 1,
    splash: 2,
    avatars: [10, 11, 12] as readonly number[],
    avataricons: [20, 21, 22] as readonly number[],
    tiles: {} as Record<string, number>,
    words: { act: 100 } as Record<string, number>,
  },
  audio: {
    tiles: { zz_a: 123 } as Record<string, number>,
    words: { act: 456 } as Record<string, number>,
    syllables: {} as Record<string, number>,
    instructions: { zzz_china: 789 } as Record<string, number>,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('loadLangPack', () => {
  it('happy path: returns LangAssets with correct code', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.code).toBe('eng');
  });

  it('happy path: audio.tiles keyed by tile.base', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.audio.tiles['a']).toBe(123);
  });

  it('happy path: images.words keyed by wordInLWC', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.images.words['act']).toBe(100);
  });

  it('happy path: settings.findBoolean works', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.settings.findBoolean('Has tile audio', false)).toBe(true);
    expect(assets.settings.findBoolean('Has syllable audio', true)).toBe(false);
  });

  it('happy path: tiles row count', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.tiles.rows).toHaveLength(1);
    expect(assets.tiles.rows[0].base).toBe('a');
  });

  it('happy path: precomputes map is a Map (may be empty)', () => {
    const assets = loadLangPack(baseManifest);
    expect(assets.precomputes).toBeInstanceOf(Map);
  });

  it('precompute registered before load appears in assets.precomputes', () => {
    registerPrecompute('testPc', (a) => ({ tileCount: a.tiles.rows.length }));
    const assets = loadLangPack(baseManifest);
    expect(assets.precomputes.get('testPc')).toEqual({ tileCount: 1 });
  });

  it('missing tile audio throws LangAssetsBindError (tile-audio)', () => {
    const manifest = {
      ...baseManifest,
      audio: {
        ...baseManifest.audio,
        tiles: {} as Record<string, number>, // zz_a is missing
      },
    };
    expect(() => loadLangPack(manifest)).toThrow(LangAssetsBindError);
    let caught: LangAssetsBindError | null = null;
    try {
      loadLangPack(manifest);
    } catch (e) {
      caught = e as LangAssetsBindError;
    }
    expect(caught?.category).toBe('tile-audio');
    expect(caught?.key).toBe('zz_a');
  });

  it('tile with zz_no_audio_needed sentinel is not in audio.tiles, no throw', () => {
    const gametiles = [
      'tiles\tOr1\tOr2\tOr3\tType\tAudioName\tUpper\tType2\tAudioName2\tType3\tAudioName3\tPlaceholder\tPlaceholder\tPlaceholder\tFirstAppearsInStage...\tFirstAppearsInStage...(Type2)\tFirstAppearsInStage...(Type3)',
      'x\ta\tb\tc\tC\tzz_no_audio_needed\tX\tnone\tN\tnone\tN\t0\t0\t0\t-\t-\t-',
    ].join('\n');
    const manifest = {
      ...baseManifest,
      rawFiles: { ...rawFiles, aa_gametiles: gametiles },
      audio: {
        ...baseManifest.audio,
        tiles: {} as Record<string, number>,
        words: {} as Record<string, number>,
      },
      images: {
        ...baseManifest.images,
        words: {} as Record<string, number>,
      },
    };
    // words/images are now empty so we also have no words rows
    const noWordManifest = {
      ...manifest,
      rawFiles: {
        ...manifest.rawFiles,
        aa_wordlist: 'EnglishLWC\tEnglishLOP\t(Placeholder. No values needed.)\tMixed-TypeSymbolsInfo\t(Placeholder. No values needed.)\tFirstAppearsInStage(IFOverrulingDefault)...\n',
        aa_games: 'Door\tCountry\tChallengeLevel\tColor\tInstructionAudio\tAudioDuration\tSyllOrTile\tStagesIncluded\n1\tChina\t1\t0\tnaWhileMPOnly\t1999\tT\t-\n',
      },
    };
    const assets = loadLangPack(noWordManifest);
    expect('x' in assets.audio.tiles).toBe(false);
  });

  it('parser failure (malformed aa_gametiles) propagates as LangPackParseError', () => {
    const manifest = {
      ...baseManifest,
      rawFiles: {
        ...rawFiles,
        aa_gametiles: 'malformed\ttoo\tfew\n',
      },
    };
    expect(() => loadLangPack(manifest)).toThrow(LangPackParseError);
  });

  it('missing rawFiles key propagates as LangPackParseError', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { aa_wordlist: _removed, ...rest } = rawFiles;
    const manifest = { ...baseManifest, rawFiles: rest };
    expect(() => loadLangPack(manifest)).toThrow(LangPackParseError);
  });
});
