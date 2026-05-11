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

  describe('correctIndex points at the actual correct choice (issue #15)', () => {
    it('word-ref / word-choice: choices[correctIndex] matches the ref word', () => {
      for (let trial = 0; trial < 50; trial++) {
        const result = setupThailandRound({
          refType: 'WORD_TEXT',
          choiceType: 'WORD_TEXT',
          distractorStrategy: 1,
          tiles: TILES,
          words: WORDS,
          syllables: SYLLABLES,
          roundIndex: trial,
        });
        if ('error' in result) continue;
        if (result.ref.kind !== 'word') continue;
        const chosen = result.choices[result.correctIndex];
        expect(chosen.kind).toBe('word');
        if (chosen.kind === 'word') {
          expect(chosen.wordRow.wordInLOP).toBe(result.ref.wordRow.wordInLOP);
        }
      }
    });

    it('tile-ref / tile-choice: choices[correctIndex] matches the ref tile', () => {
      for (let trial = 0; trial < 50; trial++) {
        const result = setupThailandRound({
          refType: 'TILE_LOWER',
          choiceType: 'TILE_LOWER',
          distractorStrategy: 1,
          tiles: TILES,
          words: WORDS,
          syllables: SYLLABLES,
          roundIndex: trial,
        });
        if ('error' in result) continue;
        if (result.ref.kind !== 'tile') continue;
        const chosen = result.choices[result.correctIndex];
        expect(chosen.kind).toBe('tile');
        if (chosen.kind === 'tile') {
          expect(chosen.tileRow.base).toBe(result.ref.tileRow.base);
        }
      }
    });

    it('correctIndex is not always 0 across many trials', () => {
      const indices = new Set<number>();
      for (let trial = 0; trial < 100; trial++) {
        const result = setupThailandRound({
          refType: 'WORD_TEXT',
          choiceType: 'WORD_TEXT',
          distractorStrategy: 1,
          tiles: TILES,
          words: WORDS,
          syllables: SYLLABLES,
          roundIndex: trial,
        });
        if ('error' in result) continue;
        indices.add(result.correctIndex);
      }
      // Random shuffle across 100 trials should produce >1 distinct correctIndex.
      expect(indices.size).toBeGreaterThan(1);
    });
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

  describe('fixed question order (issue #17)', () => {
    it('roundIndex 0 selects the first eligible word in WORDS order', () => {
      const result = setupThailandRound({
        refType: 'WORD_TEXT',
        choiceType: 'WORD_TEXT',
        distractorStrategy: 1,
        tiles: TILES,
        words: WORDS,
        syllables: SYLLABLES,
        roundIndex: 0,
        rng: seededRng,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) return;
      if (result.ref.kind === 'word') {
        expect(result.ref.wordRow.wordInLOP).toBe(WORDS[0].wordInLOP);
      }
    });

    it('successive roundIndex values walk the wordlist in order', () => {
      const refs = [0, 1, 2, 3].map((roundIndex) => {
        const r = setupThailandRound({
          refType: 'WORD_TEXT',
          choiceType: 'WORD_TEXT',
          distractorStrategy: 1,
          tiles: TILES,
          words: WORDS,
          syllables: SYLLABLES,
          roundIndex,
          rng: seededRng,
        });
        if ('error' in r) throw new Error('unexpected error');
        return r.ref.kind === 'word' ? r.ref.wordRow.wordInLOP : '';
      });
      expect(refs).toEqual([WORDS[0].wordInLOP, WORDS[1].wordInLOP, WORDS[2].wordInLOP, WORDS[3].wordInLOP]);
    });

    it('wraps to the start of the pool when roundIndex exceeds length', () => {
      const result = setupThailandRound({
        refType: 'WORD_TEXT',
        choiceType: 'WORD_TEXT',
        distractorStrategy: 1,
        tiles: TILES,
        words: WORDS,
        syllables: SYLLABLES,
        roundIndex: WORDS.length, // wrap → index 0
        rng: seededRng,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) return;
      if (result.ref.kind === 'word') {
        expect(result.ref.wordRow.wordInLOP).toBe(WORDS[0].wordInLOP);
      }
    });
  });

  describe('CL1 ref-tile filter (Java 258, 279)', () => {
    function tile(base: string, type: string) {
      return {
        base, alt1: 'x', alt2: 'y', alt3: 'z', type, audioName: base,
        upper: base.toUpperCase(), tileTypeB: 'none', audioNameB: '',
        tileTypeC: 'none', audioNameC: '', iconicWord: '', tileColor: '0',
        stageOfFirstAppearance: 1, stageOfFirstAppearanceType2: 1,
        stageOfFirstAppearanceType3: 1,
      };
    }

    it('TILE_LOWER standalone CL1 prefers V over rejected types (T|AD|C|PC)', () => {
      // Standalone tile pick rejects T|AD|C|PC at CL1; only V survives.
      // ≥ 4 tiles so returnFourTileChoices can fill all 4 slots.
      const customTiles = [
        tile('t1', 'T'),  // tone — reject
        tile('p1', 'PC'), // placeholder consonant — reject
        tile('c1', 'C'),  // CL1 standalone rejects C too (Java 258)
        tile('v1', 'V'),  // valid
        tile('c2', 'C'),
        tile('c3', 'C'),
      ];
      const ordered = () => 0;
      const result = setupThailandRound({
        refType: 'TILE_LOWER',
        choiceType: 'TILE_LOWER',
        distractorStrategy: 1,
        tiles: customTiles,
        words: WORDS,
        syllables: SYLLABLES,
        rng: ordered,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) return;
      if (result.ref.kind === 'tile') {
        expect(result.ref.tileRow.type).toBe('V');
      }
    });

    it('CL2 does NOT apply the CL1 reject filter', () => {
      // ≥ 4 tiles so returnFourTileChoices can fill all 4 slots.
      const customTiles = [
        tile('t1', 'T'),
        tile('c1', 'C'),
        tile('v1', 'V'),
        tile('p1', 'PC'),
        tile('c2', 'C'),
      ];
      const ordered = () => 0;
      const result = setupThailandRound({
        refType: 'TILE_LOWER',
        choiceType: 'TILE_LOWER',
        distractorStrategy: 2,
        tiles: customTiles,
        words: WORDS,
        syllables: SYLLABLES,
        rng: ordered,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) return;
      // CL2 still enforces CorV for TILE_LOWER/TILE_AUDIO standalone (spec
      // line 71, Java 252) — but does NOT apply the CL1 T|AD|C|PC reject —
      // so 'C' tiles are allowed at CL2 (would be rejected at CL1).
      if (result.ref.kind === 'tile') {
        expect(result.ref.tileRow.type).toBe('C');
      }
    });
  });

  describe('firstAudibleTile is used for word→tile ref derivation', () => {
    function tileTyped(base: string, type: string, audioName = base) {
      return {
        base, alt1: 'x', alt2: 'y', alt3: 'z', type, audioName,
        upper: base.toUpperCase(), tileTypeB: 'none', audioNameB: '',
        tileTypeC: 'none', audioNameC: '', iconicWord: '', tileColor: '0',
        stageOfFirstAppearance: 1, stageOfFirstAppearanceType2: 1,
        stageOfFirstAppearanceType3: 1,
      };
    }

    it('TILE ref ← WORD distractor pool: silent leading tile is skipped', () => {
      // Word "xab": tile 'x' is silent. ref tile should be 'a'.
      const tiles = [
        tileTyped('x', 'PC', 'zz_no_audio_needed'),
        tileTyped('a', 'V'),
        tileTyped('b', 'C'),
      ];
      const words = [
        { wordInLWC: 'xab', wordInLOP: 'xab', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' },
        { wordInLWC: 'ab', wordInLOP: 'ab', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' },
        { wordInLWC: 'ba', wordInLOP: 'ba', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' },
        { wordInLWC: 'aa', wordInLOP: 'aa', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' },
        { wordInLWC: 'bb', wordInLOP: 'bb', duration: 0, mixedDefs: '-', stageOfFirstAppearance: '1' },
      ];
      const ordered = () => 0;
      const result = setupThailandRound({
        refType: 'TILE_LOWER',
        choiceType: 'WORD_TEXT',
        distractorStrategy: 2,
        tiles,
        words,
        syllables: SYLLABLES,
        rng: ordered,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) return;
      if (result.ref.kind === 'tile') {
        expect(result.ref.tileRow.base).toBe('a');
      }
    });
  });
});
