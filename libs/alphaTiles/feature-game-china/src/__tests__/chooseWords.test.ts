import { chooseWords } from '../chooseWords';

function makeWord(id: string) {
  return {
    wordInLWC: id,
    wordInLOP: id,
    duration: 0,
    mixedDefs: '',
    stageOfFirstAppearance: '1',
  };
}

const THREE = ['cat', 'dog', 'hat'].map(makeWord);
const FOUR = ['fish', 'bird', 'frog', 'duck', 'wolf'].map(makeWord);

describe('chooseWords', () => {
  it('returns one 3-tile word and three distinct 4-tile words', () => {
    const seededRng = () => 0; // always pick index 0
    const result = chooseWords({ threeTileWords: THREE, fourTileWords: FOUR, rng: seededRng });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.threeTileWord).toEqual(THREE[0]);
    expect(result.fourTileWords).toHaveLength(3);
    // All four words must be distinct
    const ids = new Set([...result.fourTileWords.map((w) => w.wordInLWC)]);
    expect(ids.size).toBe(3);
  });

  it('returns insufficient-content when threeTileWords is empty', () => {
    const result = chooseWords({ threeTileWords: [], fourTileWords: FOUR });
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toBe('insufficient-content');
  });

  it('returns insufficient-content when fourTileWords has fewer than 3', () => {
    const result = chooseWords({
      threeTileWords: THREE,
      fourTileWords: FOUR.slice(0, 2),
    });
    expect('error' in result).toBe(true);
  });

  it('works with exactly 3 four-tile words', () => {
    const result = chooseWords({
      threeTileWords: THREE,
      fourTileWords: FOUR.slice(0, 3),
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.fourTileWords).toHaveLength(3);
  });

  it('does not mutate the input fourTileWords array', () => {
    const original = [...FOUR];
    chooseWords({ threeTileWords: THREE, fourTileWords: FOUR });
    expect(FOUR).toEqual(original);
  });
});
