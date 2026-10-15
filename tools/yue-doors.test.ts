/**
 * yue (Cantonese) door smoke test — issues #34 / #35 / #36.
 *
 * Loads the REAL languages/yue pack through the production loader
 * (`loadLangPack`, so tile/word/syllable audio + word-image binding is
 * exercised) and, for EVERY row in aa_games.txt, runs that mechanic's pure
 * round/data-building path many times with a seeded RNG — the same calls
 * the container makes in `startRound`. A door whose mechanic has no builder
 * here fails the test, so a new door can't be added without proof it builds.
 *
 * Also asserts the full pack validator reports 0 errors (it carries the
 * per-game cross-checks: China tile counts, Italy word count, Colombia S-CL4…).
 *
 * Run: npx jest -c tools/jest.config.ts tools/yue-doors.test.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseWordIntoSyllables, parseWordIntoTiles, buildTileHashMap, getMultitypeTiles, parseWordIntoTilesPreliminary } from '@shared/util-phoneme';
import { loadLangPack } from '../libs/alphaTiles/data-language-pack/src/loadLangPack';
import type { LangAssets } from '../libs/alphaTiles/data-language-pack/src/LangAssets';
import { validateLangPack as runValidator } from '../libs/shared/util-lang-pack-validator/src/validateLangPack';
import { readRawFiles } from './_readRawFiles';
import { buildFileInventory } from './_buildFileInventory';

import { decodeThailandChallengeLevel } from '../libs/alphaTiles/feature-game-thailand/src/decodeThailandChallengeLevel';
import { setupThailandRound } from '../libs/alphaTiles/feature-game-thailand/src/setupThailandRound';
import { refAudioKey } from '../libs/alphaTiles/feature-game-thailand/src/refAudioKey';
import { resolveMasteryAction } from '../libs/alphaTiles/feature-game-shell/src/lib/resolveMasteryAction';
import { buildTaiwanData } from '../libs/alphaTiles/feature-game-taiwan/src/buildTaiwanData';
import { pickTaiwanCharacters } from '../libs/alphaTiles/feature-game-taiwan/src/pickTaiwanCharacters';
import { countForLevel } from '../libs/alphaTiles/feature-game-georgia/src/countForLevel';
import { buildSyllableChoicesRandom } from '../libs/alphaTiles/feature-game-georgia/src/buildSyllableChoicesRandom';
import { buildSyllableHint } from '../libs/alphaTiles/feature-game-georgia/src/buildSyllableHint';
import { buildMexicoData } from '../libs/alphaTiles/feature-game-mexico/src/buildMexicoData';
import { setupMexicoBoard } from '../libs/alphaTiles/feature-game-mexico/src/setupMexicoBoard';
import { pickEcuadorWords } from '../libs/alphaTiles/feature-game-ecuador/src/pickEcuadorWords';
import { placeTiles } from '../libs/alphaTiles/feature-game-ecuador/src/placeTiles';
import { buildKeyboard } from '../libs/alphaTiles/feature-game-colombia/src/buildKeyboard';
import { evaluateStatus } from '../libs/alphaTiles/feature-game-colombia/src/evaluateStatus';
import { brazilPreProcess } from '../libs/alphaTiles/feature-game-brazil/src/brazilPreProcess';
import { buildSyllableChoices } from '../libs/alphaTiles/feature-game-brazil/src/buildSyllableChoices';
import { setupRound as setupItalyRound } from '../libs/alphaTiles/feature-game-italy/src/setupRound';
import { malaysiaPreProcess } from '../libs/alphaTiles/feature-game-malaysia/src/malaysiaPreProcess';
import { wordsForStage } from '../libs/alphaTiles/feature-game-malaysia/src/wordsForStage';
import { paginate } from '../libs/alphaTiles/feature-game-malaysia/src/paginate';
import { buildSudanData } from '../libs/alphaTiles/feature-game-sudan/src/sudanPreProcess';
import { buildIraqTileList } from '../libs/alphaTiles/feature-game-iraq/src/buildIraqTileList';
import { findWordForTile } from '../libs/alphaTiles/feature-game-iraq/src/findWordForTile';
import { pageCount, tilesForPage } from '../libs/alphaTiles/feature-game-iraq/src/iraqPagination';

const LANG_DIR = path.join(__dirname, '../languages/yue');
const ROUNDS = 200;

// ---------------------------------------------------------------------------
// Pack loading — fake Metro handles, real file listings
// ---------------------------------------------------------------------------

function stems(dir: string): Record<string, number> {
  const out: Record<string, number> = {};
  if (!fs.existsSync(dir)) return out;
  let n = 1;
  for (const f of fs.readdirSync(dir).sort()) {
    if (!fs.statSync(path.join(dir, f)).isFile()) continue;
    out[f.replace(/\.[^.]+$/, '')] = n++;
  }
  return out;
}

function loadStrokes(): Record<string, unknown> {
  const dir = path.join(LANG_DIR, 'strokes');
  const out: Record<string, unknown> = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  }
  return out;
}

function loadYue(): LangAssets {
  return loadLangPack({
    code: 'yue',
    rawFiles: readRawFiles(LANG_DIR),
    fonts: { primary: 1, primaryBold: null },
    images: {
      icon: 1,
      splash: 1,
      avatars: Object.values(stems(path.join(LANG_DIR, 'images/avatars'))),
      avataricons: Object.values(stems(path.join(LANG_DIR, 'images/avataricons'))),
      tiles: {},
      words: stems(path.join(LANG_DIR, 'images/words')),
    },
    audio: {
      tiles: stems(path.join(LANG_DIR, 'audio/tiles')),
      words: stems(path.join(LANG_DIR, 'audio/words')),
      syllables: stems(path.join(LANG_DIR, 'audio/syllables')),
      instructions: stems(path.join(LANG_DIR, 'audio/instructions')),
    },
    strokes: loadStrokes() as LangAssets['strokes'],
  });
}

/** mulberry32 — deterministic so a failure reproduces. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Per-mechanic round builders. Each mirrors its container's startRound path
// and throws (via expect) on an error / empty / unwinnable round.
// ---------------------------------------------------------------------------

type GameRow = LangAssets['games']['rows'][number];
type Builder = (assets: LangAssets, row: GameRow, rng: () => number) => void;

const SCRIPT = 'Chinese' as const;
const PH = '◌';

function randomItem<T>(xs: readonly T[], rng: () => number): T {
  return xs[Math.floor(rng() * xs.length)];
}

const BUILDERS: Record<string, Builder> = {
  thailand: (assets, row) => {
    const { refType, choiceType, distractorStrategy } = decodeThailandChallengeLevel(row.challengeLevel);
    for (let roundIndex = 0; roundIndex < ROUNDS; roundIndex++) {
      const r = setupThailandRound({
        refType, choiceType, distractorStrategy,
        tiles: assets.tiles.rows, words: assets.words.rows, syllables: assets.syllables.rows,
        roundIndex,
      });
      if ('error' in r) throw new Error(`round ${roundIndex}: ${r.error}`);
      expect(r.choices).toHaveLength(4);
      expect(r.correctIndex).toBeGreaterThanOrEqual(0);
      // H1: TILE/SYLLABLE_AUDIO refs must resolve to a bound clip under the
      // key the container plays (tile.base / syllable, not AudioName).
      const { category, key } = refAudioKey(r.ref);
      if (refType === 'TILE_AUDIO') {
        expect(category).toBe('tile');
        expect(assets.audio.tiles[key]).toBeDefined();
      }
      if (refType === 'SYLLABLE_AUDIO') {
        expect(category).toBe('syllable');
        expect(assets.audio.syllables[key]).toBeDefined();
      }
    }
  },

  taiwan: (assets) => {
    const data = buildTaiwanData(assets);
    expect(data.availableTiles.length).toBeGreaterThanOrEqual(5);
    for (let offset = 0; offset < ROUNDS; offset++) {
      expect(pickTaiwanCharacters(data.availableTiles, 5, offset)).toHaveLength(5);
    }
  },

  georgia: (assets, row, rng) => {
    expect(row.syllOrTile).toBe('S');
    const visible = countForLevel(row.challengeLevel);
    for (let i = 0; i < ROUNDS; i++) {
      const word = randomItem(assets.words.rows, rng);
      const parsed = parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows);
      expect(parsed.length).toBeGreaterThan(0);
      const texts = buildSyllableChoicesRandom({
        visibleGameButtons: visible,
        syllablePool: [...assets.syllables.rows],
        correctText: parsed[0].syllable,
        rng,
      });
      expect(texts.slice(0, visible)).toContain(parsed[0].syllable);
      // #30: prompt shows the word minus its first syllable.
      const hint = buildSyllableHint({ syllables: parsed.map((p) => p.syllable) });
      expect(hint).toBe('__' + word.wordInLOP.slice(parsed[0].syllable.length));
    }
  },

  mexico: (assets, row, rng) => {
    const pairCount = ({ 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 } as Record<number, number>)[row.challengeLevel];
    expect(pairCount).toBeDefined();
    const { validMatchingWords } = buildMexicoData(assets);
    for (let i = 0; i < ROUNDS; i++) {
      const r = setupMexicoBoard(validMatchingWords, pairCount, rng);
      if ('error' in r) throw new Error(r.error);
      expect(r.cards).toHaveLength(pairCount * 2);
      for (const c of r.cards) expect(assets.images.words[c.word.wordInLWC]).toBeDefined();
    }
  },

  ecuador: (assets, _row, rng) => {
    for (let i = 0; i < ROUNDS; i++) {
      const pick = pickEcuadorWords({ words: assets.words.rows, rng });
      if ('error' in pick) throw new Error(pick.error);
      expect(assets.images.words[pick.prompt.wordInLWC]).toBeDefined();
      expect(pick.tileWords).toHaveLength(8);
      const placements = placeTiles({ area: { width: 400, height: 800 }, rng });
      expect(placements).not.toBeNull();
      expect(placements).toHaveLength(8);
    }
  },

  colombia: (assets, row, rng) => {
    expect(row.syllOrTile).toBe('S'); // T variants are not meaningful for whole-word tiles
    const level = row.challengeLevel as 1 | 2 | 3;
    for (let i = 0; i < ROUNDS; i++) {
      const word = randomItem(assets.words.rows, rng);
      const parsedTiles = parseWordIntoTiles({
        wordInLOP: word.wordInLOP, mixedDefs: word.mixedDefs,
        tiles: assets.tiles.rows, scriptType: SCRIPT, placeholderCharacter: PH,
      });
      expect(parsedTiles?.length).toBeGreaterThan(0);
      const parsedSyllables = parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows);
      expect(parsedSyllables.length).toBeGreaterThan(0);
      const kb = buildKeyboard({
        level, variant: 'S', parsedTiles: parsedTiles ?? [], parsedSyllables,
        tileList: assets.tiles.rows, syllableList: assets.syllables.rows,
        keyList: assets.keys.rows, colorList: assets.colors.hexByIndex, rng,
      });
      const keyTexts = kb.keys.map((k) => k.text);
      for (const s of parsedSyllables) expect(keyTexts).toContain(s.syllable);
      const result = evaluateStatus({
        level, variant: 'S',
        clickedKeys: parsedSyllables.map((s) => ({ text: s.syllable })),
        tilesInBuiltWord: [], parsedTiles: parsedTiles ?? [], parsedSyllables,
        refWord: { wordInLOP: word.wordInLOP, mixedDefs: word.mixedDefs },
        tiles: assets.tiles.rows, scriptType: SCRIPT, placeholderCharacter: PH,
      });
      expect(result.isWin).toBe(true);
    }
  },

  brazil: (assets, row, rng) => {
    expect(row.syllOrTile).toBe('S'); // T variants need C/V/T tile types; yue is all X
    const data = brazilPreProcess(assets);
    for (let i = 0; i < ROUNDS; i++) {
      const word = randomItem(assets.words.rows, rng);
      const parsed = parseWordIntoSyllables(word.wordInLOP, assets.syllables.rows);
      expect(parsed.length).toBeGreaterThan(0);
      const correct = randomItem(parsed, rng);
      const { choices, visibleChoiceCount } = buildSyllableChoices({
        challengeLevel: row.challengeLevel, correct,
        syllablePool: data.syllables, allSyllables: assets.syllables.rows, rand: rng,
      });
      const visible = choices.slice(0, visibleChoiceCount).map((c) => c.text);
      expect(visible).toContain(correct.syllable);
      expect(visible.every((t) => t !== '')).toBe(true);
    }
  },

  italy: (assets, row, rng) => {
    const deckSize = Math.max(16, assets.settings.findInt('Italy Deck Size', 54));
    const source: readonly unknown[] = row.syllOrTile === 'S' ? assets.syllables.rows : assets.words.rows;
    for (let i = 0; i < ROUNDS; i++) {
      const r = setupItalyRound(source, deckSize, 16, rng);
      if ('error' in r) throw new Error(r.error);
      expect(r.board).toHaveLength(16);
      expect(r.deck).toHaveLength(deckSize);
    }
  },

  malaysia: (assets) => {
    const data = malaysiaPreProcess(assets);
    const pages = paginate(wordsForStage(data.wordStagesByStage, 1), 11);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.flat()).toHaveLength(assets.words.rows.length);
  },

  sudan: (assets, row) => {
    const data = buildSudanData(assets, 7);
    if (row.syllOrTile === 'S') {
      expect(data.syllablePages.flat()).toHaveLength(assets.syllables.rows.length);
    } else {
      expect(data.tilePages.flat().length).toBeGreaterThan(0);
    }
  },

  iraq: (assets, _row, rng) => {
    const list = buildIraqTileList({ tiles: assets.tiles.rows, differentiatesTileTypes: false });
    expect(list.length).toBeGreaterThan(0);
    const pages = pageCount(list.length);
    expect(pages).toBeGreaterThan(0);
    for (let p = 0; p < pages; p++) expect(tilesForPage(list, p).length).toBeGreaterThan(0);
    const tileMap = buildTileHashMap(assets.tiles.rows, PH);
    const multitype = getMultitypeTiles(assets.tiles.rows);
    const parseWord = (w: { wordInLOP: string; mixedDefs: string }): string[] =>
      (parseWordIntoTilesPreliminary(w.wordInLOP, w.mixedDefs, tileMap, multitype, PH) ?? []).map((t) => t.base);
    const resolved = list.filter((t) =>
      findWordForTile({ tileBase: t.base, words: assets.words.rows, scanSetting: 1, parseWord, rng }) !== null,
    );
    // Most yue tiles ARE a word; a tap on the few without one just plays audio.
    expect(resolved.length / list.length).toBeGreaterThan(0.9);
  },
};

// ---------------------------------------------------------------------------

describe('yue pack — every door builds rounds against real data', () => {
  let assets: LangAssets;
  let warnSpy: jest.SpyInstance;

  beforeAll(() => {
    // parseWordIntoTiles warns once per call for the unregistered Chinese parser.
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    assets = loadYue();
  });
  afterAll(() => warnSpy.mockRestore());

  it('validator reports no errors (incl. per-game cross-checks)', () => {
    const report = runValidator({
      rawFiles: readRawFiles(LANG_DIR),
      fileInventory: buildFileInventory(LANG_DIR),
    });
    const errors = report.issues.filter((i) => i.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('honours "After 12 checked trackers = 1": shell keeps playing at mastery (H2)', () => {
    expect(resolveMasteryAction({ settings: assets.settings })).toBe('keep-playing');
  });

  it('has a builder for every door', () => {
    const missing = assets.games.rows.map((r) => r.classKey).filter((k) => !BUILDERS[k]);
    expect(missing).toEqual([]);
  });

  const rows = parseRowsForTitles();
  it.each(rows)('door %s — %s CL%s %s', (door) => {
    const row = assets.games.rows.find((r) => r.door === door);
    if (!row) throw new Error(`door ${door} missing`);
    const builder = BUILDERS[row.classKey];
    if (!builder) throw new Error(`no data-building proof for ${row.classKey}`);
    builder(assets, row, seeded(door * 7919));
  });
});

/** Door list for test titles, read before beforeAll runs. */
function parseRowsForTitles(): Array<[number, string, number, string]> {
  return fs
    .readFileSync(path.join(LANG_DIR, 'aa_games.txt'), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter((l) => l.trim() !== '')
    .map((l) => l.split('\t'))
    .map((c) => [Number(c[0]), c[1], Number(c[2]), c[6]]);
}
