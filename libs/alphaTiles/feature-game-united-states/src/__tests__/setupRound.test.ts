/**
 * Unit tests for setupRound.ts.
 * Uses minimal in-test mocks — no external package imports to avoid RN babel issues.
 */
import { setupRound } from '../setupRound';

// Minimal tile rows for a 3-tile word "cat" (c, a, t) with alts
function makeTileRow(
  base: string,
  alt1 = 'x',
  alt2 = 'y',
  alt3 = 'z',
  tileTypeB = 'none',
) {
  return {
    base,
    alt1,
    alt2,
    alt3,
    type: 'C',
    tileTypeB,
    tileTypeC: 'none',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
    audioName: base,
    audioNameB: '',
    audioNameC: '',
  };
}

const TILE_ROWS = [
  makeTileRow('c', 'k', 's', 'g'),
  makeTileRow('a', 'e', 'i', 'o'),
  makeTileRow('t', 'd', 'p', 'b'),
  makeTileRow('x'),
  makeTileRow('y'),
  makeTileRow('z'),
];

const CAT_WORD = {
  wordInLOP: 'cat',
  wordInLWC: 'cat',
  mixedDefs: '',
};

function makeAssets() {
  return {
    tiles: { rows: TILE_ROWS },
    words: { rows: [CAT_WORD] },
    langInfo: {
      find: (_key: string) => null,
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeData(): any {
  return {
    level1Words: [CAT_WORD],
    level2Words: [CAT_WORD],
    level3Words: [CAT_WORD],
  };
}

describe('setupRound', () => {
  it('returns a word and pairs of length equal to tile count', () => {
    const result = setupRound({
      unitedStatesData: makeData(),
      challengeLevel: 1,
      assets: makeAssets(),
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.pairs).toHaveLength(3); // c-a-t = 3 tiles
  });

  it('each pair has a correct tile matching the word tile at that position', () => {
    const result = setupRound({
      unitedStatesData: makeData(),
      challengeLevel: 1,
      assets: makeAssets(),
    });
    if ('error' in result) return;
    const expectedTiles = ['c', 'a', 't'];
    for (let i = 0; i < result.pairs.length; i++) {
      const pair = result.pairs[i];
      const correctText = pair.correct === 'top' ? pair.top : pair.bottom;
      expect(correctText).toBe(expectedTiles[i]);
    }
  });

  it('each pair contains exactly one distractor different from the correct tile', () => {
    // Using fixed alts that are all distinct from the correct tile, so a raw
    // index-based pick (Java rand.nextInt(ALT_COUNT)) still yields a different value.
    const result = setupRound({
      unitedStatesData: makeData(),
      challengeLevel: 1,
      assets: makeAssets(),
    });
    if ('error' in result) return;
    for (const pair of result.pairs) {
      const correctText = pair.correct === 'top' ? pair.top : pair.bottom;
      const distractorText = pair.correct === 'top' ? pair.bottom : pair.top;
      expect(distractorText).not.toBe(correctText);
    }
  });

  it('picks distractor by raw index into [alt1, alt2, alt3] without filtering (Java parity)', () => {
    // Build a tile where alt2 === correct base, alt3 is empty, alt1 is unique.
    // Java's rand.nextInt(ALT_COUNT) makes no attempt to skip these, so with a
    // deterministic rng forcing index 1 we EXPECT the distractor to equal the
    // correct base (alt2), proving no defensive filter is in place.
    const tileRows = [
      // 'c' tile: alt1='k', alt2='c' (== base), alt3=''
      makeTileRow('c', 'k', 'c', ''),
      makeTileRow('a', 'e', 'i', 'o'),
      makeTileRow('t', 'd', 'p', 'b'),
    ];
    const assets = {
      tiles: { rows: tileRows },
      words: { rows: [{ wordInLOP: 'c', wordInLWC: 'c', mixedDefs: '' }] },
      langInfo: { find: () => null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      level1Words: [{ wordInLOP: 'c', wordInLWC: 'c', mixedDefs: '' }],
      level2Words: [],
      level3Words: [],
    };
    // rng sequence: pickWord (idx0), pickDistractor (idx1 → alt2='c'), correctIsTop (top)
    const seq = [0, 0.5, 0]; // floor(0*3)=0 word, floor(0.5*3)=1 distractor → 'c', 0 → top
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const result = setupRound({
      unitedStatesData: data,
      challengeLevel: 1,
      assets,
      rng,
    });
    if ('error' in result) throw new Error('expected pairs');
    const pair = result.pairs[0];
    const distractor = pair.correct === 'top' ? pair.bottom : pair.top;
    // With raw indexing, distractor === 'c' (== correct) — Java would do the same.
    expect(distractor).toBe('c');
  });

  it('returns empty distractor when the chosen alt slot is empty (Java parity)', () => {
    // alt slots: ['k', '', 'g']. Forcing index 1 yields '' just like Java would.
    const tileRows = [makeTileRow('c', 'k', '', 'g')];
    const assets = {
      tiles: { rows: tileRows },
      words: { rows: [{ wordInLOP: 'c', wordInLWC: 'c', mixedDefs: '' }] },
      langInfo: { find: () => null },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      level1Words: [{ wordInLOP: 'c', wordInLWC: 'c', mixedDefs: '' }],
      level2Words: [],
      level3Words: [],
    };
    // floor(0.5*3)=1 → alt2 = ''
    const seq = [0, 0.5, 0];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const result = setupRound({
      unitedStatesData: data,
      challengeLevel: 1,
      assets,
      rng,
    });
    if ('error' in result) throw new Error('expected pairs');
    const pair = result.pairs[0];
    const distractor = pair.correct === 'top' ? pair.bottom : pair.top;
    expect(distractor).toBe('');
  });

  it('returns insufficient-content when word pool is empty', () => {
    const result = setupRound({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unitedStatesData: { level1Words: [], level2Words: [], level3Words: [] } as any,
      challengeLevel: 1,
      assets: makeAssets(),
    });
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toBe('insufficient-content');
  });

  it('randomizes the correct tile position (top/bottom) across calls', () => {
    let topCount = 0;
    let bottomCount = 0;
    // Run many times to confirm both positions appear
    for (let i = 0; i < 40; i++) {
      const result = setupRound({
        unitedStatesData: makeData(),
        challengeLevel: 1,
        assets: makeAssets(),
      });
      if ('error' in result) continue;
      result.pairs.forEach((pair) => {
        if (pair.correct === 'top') topCount++;
        else bottomCount++;
      });
    }
    expect(topCount).toBeGreaterThan(0);
    expect(bottomCount).toBeGreaterThan(0);
  });

  it('produces deterministic output with a seeded rng', () => {
    function seededRng(seed: number) {
      let n = seed;
      return () => {
        n = (n * 16807) % 2147483647;
        return (n - 1) / 2147483646;
      };
    }
    const result1 = setupRound({
      unitedStatesData: makeData(),
      challengeLevel: 1,
      assets: makeAssets(),
      rng: seededRng(42),
    });
    const result2 = setupRound({
      unitedStatesData: makeData(),
      challengeLevel: 1,
      assets: makeAssets(),
      rng: seededRng(42),
    });
    expect(result1).toEqual(result2);
  });

  it('uses level3Words for challengeLevel 3', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      level1Words: [],
      level2Words: [],
      level3Words: [CAT_WORD],
    };
    const result = setupRound({
      unitedStatesData: data,
      challengeLevel: 3,
      assets: makeAssets(),
    });
    expect('error' in result).toBe(false);
  });

  it('uses level1Words for challengeLevel 1', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      level1Words: [CAT_WORD],
      level2Words: [],
      level3Words: [],
    };
    const result = setupRound({
      unitedStatesData: data,
      challengeLevel: 1,
      assets: makeAssets(),
    });
    expect('error' in result).toBe(false);
  });
});
