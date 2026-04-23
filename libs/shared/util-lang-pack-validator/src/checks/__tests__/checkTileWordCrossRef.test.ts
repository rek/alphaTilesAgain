import { checkTileWordCrossRef } from '../checkTileWordCrossRef';
import { mkParsed, mkTileRow, mkWordRow } from '../../__tests__/testHelpers';

describe('checkTileWordCrossRef', () => {
  it('no issues when all words parse correctly', () => {
    const tiles = ['a', 'b', 'c'].map((base) => mkTileRow({ base, type: 'V', alt1: '', alt2: '', alt3: '' }));
    // Give each tile distinct alts so distractor check won't fire from tile structure
    const parsed = mkParsed({
      tileRows: tiles,
      wordRows: [mkWordRow({ wordInLWC: 'abc', wordInLOP: 'abc' })],
    });
    const result = checkTileWordCrossRef(parsed);
    expect(result.issues.filter((i) => i.code === 'WORD_CANNOT_PARSE_INTO_TILES')).toHaveLength(0);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('flags word that cannot be parsed into tiles', () => {
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a', type: 'V' })],
      wordRows: [mkWordRow({ wordInLWC: 'xyz', wordInLOP: 'xyz' })], // 'x', 'y', 'z' not in tiles
    });
    const result = checkTileWordCrossRef(parsed);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'WORD_CANNOT_PARSE_INTO_TILES',
      severity: 'error',
    }));
  });

  it('counts 3-tile and 4-tile words', () => {
    const tiles = ['a', 'b', 'c', 'd'].map((base) => mkTileRow({ base, type: 'V', alt1: '', alt2: '', alt3: '' }));
    const parsed = mkParsed({
      tileRows: tiles,
      wordRows: [
        mkWordRow({ wordInLWC: 'abc', wordInLOP: 'abc' }),  // 3 tiles
        mkWordRow({ wordInLWC: 'abcd', wordInLOP: 'abcd' }), // 4 tiles
      ],
    });
    const result = checkTileWordCrossRef(parsed);
    expect(result.threeCount).toBe(1);
    expect(result.fourCount).toBe(1);
  });

  it('flags tile used in too few words', () => {
    // Single tile used in only 1 word — below threshold of 5
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a', type: 'V', alt1: '', alt2: '', alt3: '' })],
      wordRows: [mkWordRow({ wordInLWC: 'a', wordInLOP: 'a' })],
    });
    const result = checkTileWordCrossRef(parsed);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'TILE_UNDERUSED',
      severity: 'info',
    }));
  });

  it('returns empty result when no tiles', () => {
    const parsed = mkParsed({ tileRows: [] });
    const result = checkTileWordCrossRef(parsed);
    expect(result.issues).toHaveLength(0);
    expect(result.threeCount).toBe(0);
    expect(result.fourCount).toBe(0);
  });
});
