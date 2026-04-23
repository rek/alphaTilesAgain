import { computeStageCorrespondence } from './computeStageCorrespondence';
import { selectWordForStage } from './selectWordForStage';
import { tileStagesLists } from './tileStagesLists';
import { wordStagesLists } from './wordStagesLists';

// --- Fixtures ---

function tile(base: string, stage: number) {
  return { base, stageOfFirstAppearance: stage };
}

function word(wordInLOP: string, stage = '') {
  return { wordInLOP, stageOfFirstAppearance: stage };
}

function parsedTile(base: string) {
  return { base };
}

// Simple parser: splits word into single-char tiles matching the given tile list.
function makeParser(tiles: { base: string }[]) {
  const bases = tiles.map((t) => t.base);
  return (w: { wordInLOP: string }) =>
    w.wordInLOP.split('').filter((c) => bases.includes(c)).map(parsedTile);
}

// Seeded deterministic RNG — cycles through provided values.
function seededRng(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

// --- tileStagesLists ---

describe('tileStagesLists', () => {
  it('bins each tile into result[stage-1]', () => {
    const tiles = [tile('a', 1), tile('b', 2), tile('c', 3)];
    const result = tileStagesLists(tiles);
    expect(result[0]).toEqual([tile('a', 1)]);
    expect(result[1]).toEqual([tile('b', 2)]);
    expect(result[2]).toEqual([tile('c', 3)]);
    expect(result.length).toBe(7);
  });

  it('tile at stage 3 appears only in result[2]', () => {
    const tiles = [tile('x', 3), tile('y', 1)];
    const result = tileStagesLists(tiles);
    expect(result[2]).toContainEqual(tile('x', 3));
    expect(result[0]).not.toContainEqual(tile('x', 3));
  });

  it('always returns length 7', () => {
    expect(tileStagesLists([]).length).toBe(7);
  });

  it('accepts custom getStage callback', () => {
    const tiles = [{ base: 'a', stageOfFirstAppearance: 1, customStage: 4 }];
    const result = tileStagesLists(tiles, (t) => t.customStage);
    expect(result[3]).toHaveLength(1);
    expect(result[0]).toHaveLength(0);
  });
});

// --- computeStageCorrespondence ---

describe('computeStageCorrespondence', () => {
  const allTiles = [tile('a', 1), tile('b', 1), tile('c', 1), tile('d', 1)];
  const parse = makeParser(allTiles);

  it('full correspondence returns 1.0', () => {
    const stageTiles = [tile('a', 1), tile('b', 1), tile('c', 1)];
    const w = word('abc');
    expect(computeStageCorrespondence(w, stageTiles, parse)).toBe(1.0);
  });

  it('partial correspondence returns correct fraction', () => {
    const stageTiles = [tile('a', 1), tile('b', 1)];
    const w = word('abcd');
    expect(computeStageCorrespondence(w, stageTiles, parse)).toBe(0.5);
  });

  it('empty word tiles returns 0', () => {
    const w = word('');
    expect(computeStageCorrespondence(w, [tile('a', 1)], parse)).toBe(0);
  });
});

// --- wordStagesLists ---

describe('wordStagesLists', () => {
  const tiles = [
    tile('a', 1), tile('b', 1),   // stage 1
    tile('c', 2), tile('d', 2),   // stage 2
    tile('e', 3),                   // stage 3
  ];
  const tStages = tileStagesLists(tiles);
  const parse = makeParser(tiles);

  it('word fully covered by stage 1 tiles goes to stage 1', () => {
    const words = [word('ab')];
    const result = wordStagesLists(words, tStages, parse, 0.5);
    expect(result[0]).toContainEqual(word('ab'));
  });

  it('word requiring stage 2 tiles goes to stage 2', () => {
    const words = [word('ac')]; // 'a' in stage1, 'c' in stage2 → cumulative stage2 covers both
    const result = wordStagesLists(words, tStages, parse, 1.0);
    expect(result[1]).toContainEqual(word('ac'));
    expect(result[0]).not.toContainEqual(word('ac'));
  });

  it('explicit stageOfFirstAppearance overrides computed stage', () => {
    const words = [word('ab', '3')]; // 'ab' would go to stage 1, but forced to stage 3
    const result = wordStagesLists(words, tStages, parse, 0.5);
    expect(result[2]).toContainEqual(word('ab', '3'));
    expect(result[0]).not.toContainEqual(word('ab', '3'));
  });

  it('always returns length 7', () => {
    expect(wordStagesLists([], tStages, parse, 0.5).length).toBe(7);
  });
});

// --- selectWordForStage ---

describe('selectWordForStage', () => {
  const tiles = [tile('a', 1), tile('b', 1), tile('c', 2)];
  const tStages = tileStagesLists(tiles);
  const parse = makeParser(tiles);

  // Stage 1 words: 'ab' has 100% correspondence (high), 'ac' has 50% (low)
  const highWord = word('ab');
  const lowWord1 = word('ac');
  const lowWord2 = word('bc');
  const stage2Word = word('cc');

  const wStages: ReturnType<typeof word>[][] = [
    [highWord, lowWord1, lowWord2], // stage 1
    [stage2Word],                    // stage 2
    [], [], [], [], [],
  ];

  const baseOpts = {
    wordStagesLists: wStages,
    previousStagesWordList: [] as ReturnType<typeof word>[],
    previouslyShown: [] as string[],
    correspondenceRatio: 0.5,
    stage1Tiles: tStages[0],
    parseWordIntoTiles: parse,
  };

  it('stage 1, rng < 0.5 → picks from high-correspondence pool', () => {
    // rng: [0.3 → pick high pool, 0.0 → pick first high word]
    const result = selectWordForStage({ ...baseOpts, stage: 1, previouslyShown: [], rng: seededRng(0.3, 0.0) });
    expect(result).toBe(highWord);
  });

  it('stage 1, rng >= 0.5 → picks from low-correspondence pool', () => {
    // rng: [0.7 → pick low pool, 0.0 → first low word]
    const result = selectWordForStage({ ...baseOpts, stage: 1, previouslyShown: [], rng: seededRng(0.7, 0.0) });
    expect([lowWord1, lowWord2]).toContain(result);
  });

  it('stage ratchet: empty stage 5 falls back to nearest non-empty', () => {
    const sparse: ReturnType<typeof word>[][] = [
      [highWord, lowWord1, lowWord2], // stage 1
      [stage2Word],                    // stage 2
      [], [], [], [], [],
    ];
    // stage 5 is empty → ratchets to stage 2 (nearest non-empty ≤ 5)
    const result = selectWordForStage({
      ...baseOpts,
      stage: 5,
      wordStagesLists: sparse,
      previousStagesWordList: [highWord, lowWord1, lowWord2],
      previouslyShown: [],
      rng: seededRng(0.3, 0.0), // picks current-stage words
    });
    expect([stage2Word, highWord, lowWord1, lowWord2]).toContain(result);
  });

  it('previouslyShown avoidance skips recently shown word and re-rolls', () => {
    // highWord already shown; re-roll should return a different word.
    const shown = ['ab'];
    const result = selectWordForStage({
      ...baseOpts,
      stage: 1,
      previouslyShown: shown,
      // First roll: 0.3 → high pool → 'ab' (already shown, skip)
      // Second roll: 0.3 → high pool → 'ab' is still only high word;
      // but rng sequence hits low pool on retry via 0.7
      rng: seededRng(0.3, 0.0, 0.7, 0.0),
    });
    expect(result).not.toBe(highWord);
  });

  it('previouslyShown window trims oldest when full', () => {
    // stage1WordCount = 3, windowSize = min(2, 12) = 2
    const shown = ['ac']; // 1 item, window = 2
    selectWordForStage({
      ...baseOpts,
      stage: 1,
      previouslyShown: shown,
      rng: seededRng(0.3, 0.0), // picks highWord ('ab')
    });
    expect(shown).toContain('ab');
  });

  it('stage 2, rng < 0.5 → picks from current-stage words', () => {
    const result = selectWordForStage({
      ...baseOpts,
      stage: 2,
      wordStagesLists: wStages,
      previousStagesWordList: [highWord, lowWord1, lowWord2],
      previouslyShown: [],
      rng: seededRng(0.3, 0.0), // < 0.5 → current stage
    });
    expect(result).toBe(stage2Word);
  });

  it('stage 2, rng >= 0.5 → picks from previous-stage words', () => {
    const result = selectWordForStage({
      ...baseOpts,
      stage: 2,
      wordStagesLists: wStages,
      previousStagesWordList: [highWord, lowWord1, lowWord2],
      previouslyShown: [],
      rng: seededRng(0.7, 0.0), // >= 0.5 → previous stages
    });
    expect([highWord, lowWord1, lowWord2]).toContain(result);
  });
});
