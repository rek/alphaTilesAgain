import { setUpTiles } from '../setUpTiles';

function makeWord(wordInLWC: string) {
  return { wordInLWC, wordInLOP: wordInLWC, duration: 0, mixedDefs: '', stageOfFirstAppearance: '1' };
}

// parseTiles: splits word into individual characters (simulates tile parsing)
const parseTiles = (word: { wordInLOP: string }) => word.wordInLOP.split('');

const THREE_WORD = makeWord('cat'); // 3 tiles
const FOUR_WORDS: [typeof THREE_WORD, typeof THREE_WORD, typeof THREE_WORD] = [
  makeWord('fish'),
  makeWord('bird'),
  makeWord('frog'),
];

// Seeded LCG for deterministic tests
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('setUpTiles', () => {
  it('returns a 16-cell board with exactly one blank', () => {
    const result = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles,
      moves: 5,
      rng: seededRng(42),
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.boardText).toHaveLength(16);
    const blanks = result.boardText.filter((t) => t === '');
    expect(blanks).toHaveLength(1);
    expect(result.blankIndex).toBe(result.boardText.indexOf(''));
  });

  it('board contains all 15 tiles plus blank', () => {
    const result = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles,
      moves: 5,
      rng: seededRng(99),
    });
    if (!result) return;
    const nonBlank = result.boardText.filter((t) => t !== '');
    expect(nonBlank).toHaveLength(15);
    // All tiles should come from the four words
    const expected = [
      ...'fish'.split(''),
      ...'bird'.split(''),
      ...'frog'.split(''),
      ...'cat'.split(''),
    ].sort();
    expect(nonBlank.sort()).toEqual(expected);
  });

  it('returns null when tile count is not 15', () => {
    // parseTiles returns wrong count
    const badParse = () => ['a', 'b']; // always 2 tiles → totals 8, not 15
    const result = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles: badParse,
      moves: 5,
    });
    expect(result).toBeNull();
  });

  it('moves=5 and moves=15 produce different boards (different shuffle depths)', () => {
    const rng = seededRng(7);
    const result5 = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles,
      moves: 5,
      rng: seededRng(7),
    });
    const result15 = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles,
      moves: 15,
      rng: seededRng(7),
    });
    // Very likely to differ with different move counts
    expect(result5?.boardText).not.toEqual(result15?.boardText);
    void rng; // suppress unused warning
  });

  it('blankIndex is consistent with boardText blank position', () => {
    const result = setUpTiles({
      threeTileWord: THREE_WORD,
      fourTileWords: FOUR_WORDS,
      parseTiles,
      moves: 10,
      rng: seededRng(1234),
    });
    if (!result) return;
    expect(result.boardText[result.blankIndex]).toBe('');
  });
});
