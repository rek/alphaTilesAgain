import { setupThailandRound } from '../setupThailandRound';

function makeTile(base: string, alt1 = 'x', alt2 = 'y', alt3 = 'z', upper = base.toUpperCase()) {
  return {
    base,
    alt1,
    alt2,
    alt3,
    type: 'C',
    audioName: base,
    upper,
    tileTypeB: 'none',
    audioNameB: '',
    tileTypeC: 'none',
    audioNameC: '',
    iconicWord: '',
    tileColor: '0',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeWord(lwc: string, lop: string, mixedDefs = '-') {
  return {
    wordInLWC: lwc,
    wordInLOP: lop,
    duration: 0,
    mixedDefs,
    stageOfFirstAppearance: '1',
  };
}

function makeSyllable(syllable: string, d1 = 'x', d2 = 'y', d3 = 'z') {
  return {
    syllable,
    distractors: [d1, d2, d3] as [string, string, string],
    audioName: syllable,
    duration: 500,
    color: '0',
  };
}

const TILES = [
  makeTile('a', 'e', 'i', 'o'),
  makeTile('b', 'p', 'd', 'g'),
  makeTile('c', 'k', 's', 't'),
  makeTile('d', 'b', 't', 'p'),
  makeTile('e', 'a', 'i', 'o'),
  makeTile('f', 'v', 'ph', 'b'),
  makeTile('g', 'k', 'd', 'b'),
  makeTile('h', 'wh', 'ch', 'sh'),
];

const WORDS = [
  makeWord('apple', 'apple'),
  makeWord('bat', 'bat'),
  makeWord('cat', 'cat'),
  makeWord('dog', 'dog'),
  makeWord('egg', 'egg'),
  makeWord('fig', 'fig'),
  makeWord('hat', 'hat'),
  makeWord('hay', 'hay'),
];

const SYLLABLES = [
  makeSyllable('ba', 'pa', 'da', 'ga'),
  makeSyllable('ta', 'da', 'ka', 'pa'),
  makeSyllable('da', 'ta', 'ba', 'ka'),
  makeSyllable('ka', 'ga', 'ta', 'da'),
  makeSyllable('ma', 'na', 'ba', 'da'),
];

const seededRng = () => 0.5;

describe('setupThailandRound', () => {
  describe('always returns exactly 4 choices', () => {
    const cases: Array<{ refType: Parameters<typeof setupThailandRound>[0]['refType']; choiceType: Parameters<typeof setupThailandRound>[0]['choiceType'] }> = [
      { refType: 'TILE_LOWER', choiceType: 'TILE_LOWER' },
      { refType: 'TILE_AUDIO', choiceType: 'TILE_LOWER' },
      { refType: 'TILE_UPPER', choiceType: 'TILE_UPPER' },
      { refType: 'WORD_TEXT', choiceType: 'WORD_TEXT' },
      { refType: 'WORD_IMAGE', choiceType: 'WORD_TEXT' },
      { refType: 'TILE_LOWER', choiceType: 'WORD_TEXT' },
    ];

    for (const { refType, choiceType } of cases) {
      it(`refType=${refType} choiceType=${choiceType} → 4 choices`, () => {
        const result = setupThailandRound({
          refType,
          choiceType,
          distractorStrategy: 1,
          tiles: TILES,
          words: WORDS,
          syllables: SYLLABLES,
          rng: seededRng,
        });
        expect('error' in result).toBe(false);
        if ('error' in result) return;
        expect(result.choices).toHaveLength(4);
      });
    }
  });

  it('syllable ref → syllable choices returns 4', () => {
    const result = setupThailandRound({
      refType: 'SYLLABLE_TEXT',
      choiceType: 'SYLLABLE_TEXT',
      distractorStrategy: 1,
      tiles: TILES,
      words: WORDS,
      syllables: SYLLABLES,
      rng: seededRng,
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.choices).toHaveLength(4);
  });

  it('correctIndex is within [0,3]', () => {
    const result = setupThailandRound({
      refType: 'TILE_LOWER',
      choiceType: 'TILE_LOWER',
      distractorStrategy: 1,
      tiles: TILES,
      words: WORDS,
      syllables: SYLLABLES,
      rng: seededRng,
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.correctIndex).toBeGreaterThanOrEqual(0);
    expect(result.correctIndex).toBeLessThan(4);
  });

  it('returns insufficient-content when tiles list is empty (tile-choice mode)', () => {
    const result = setupThailandRound({
      refType: 'TILE_LOWER',
      choiceType: 'TILE_LOWER',
      distractorStrategy: 1,
      tiles: [],
      words: WORDS,
      syllables: SYLLABLES,
      rng: seededRng,
    });
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toBe('insufficient-content');
  });

  it('returns insufficient-content when words list is too small (word-choice mode)', () => {
    const result = setupThailandRound({
      refType: 'WORD_TEXT',
      choiceType: 'WORD_TEXT',
      distractorStrategy: 1,
      tiles: TILES,
      words: WORDS.slice(0, 1),
      syllables: SYLLABLES,
      rng: seededRng,
    });
    expect('error' in result).toBe(true);
  });

  it('distractorStrategy 2 uses alt tiles as distractors', () => {
    const result = setupThailandRound({
      refType: 'TILE_LOWER',
      choiceType: 'TILE_LOWER',
      distractorStrategy: 2,
      tiles: TILES,
      words: WORDS,
      syllables: SYLLABLES,
      rng: seededRng,
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.choices).toHaveLength(4);
  });

  it('choices all have distinct display values for tile choices', () => {
    const result = setupThailandRound({
      refType: 'TILE_LOWER',
      choiceType: 'TILE_LOWER',
      distractorStrategy: 1,
      tiles: TILES,
      words: WORDS,
      syllables: SYLLABLES,
      rng: Math.random,
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    const texts = result.choices.map((c) => {
      if (c.kind === 'tile') return c.displayText;
      return '';
    });
    const unique = new Set(texts);
    expect(unique.size).toBe(4);
  });
});
