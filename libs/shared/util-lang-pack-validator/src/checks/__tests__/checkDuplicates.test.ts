import { checkDuplicates } from '../checkDuplicates';
import { mkParsed, mkTileRow, mkWordRow, mkGameRow, mkSyllableRow } from '../../__tests__/testHelpers';

describe('checkDuplicates', () => {
  it('no issues on clean input', () => {
    const parsed = mkParsed({
      tileRows: [
        mkTileRow({ base: 'a', alt1: 'b', alt2: 'c', alt3: 'd' }),
        mkTileRow({ base: 'b', alt1: 'a', alt2: 'c', alt3: 'd' }),
      ],
    });
    expect(checkDuplicates(parsed)).toHaveLength(0);
  });

  it('flags duplicate tile base keys', () => {
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a' }), mkTileRow({ base: 'a' })],
    });
    const issues = checkDuplicates(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_TILE_KEY',
      severity: 'error',
      context: expect.objectContaining({ key: 'a' }),
    }));
  });

  it('flags duplicate word LWC keys', () => {
    const parsed = mkParsed({
      wordRows: [mkWordRow({ wordInLWC: 'dog' }), mkWordRow({ wordInLWC: 'dog' })],
    });
    const issues = checkDuplicates(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_WORD_KEY',
      severity: 'error',
    }));
  });

  it('flags duplicate syllable keys', () => {
    const parsed = mkParsed({
      syllableRows: [mkSyllableRow('ap'), mkSyllableRow('ap')],
    });
    const issues = checkDuplicates(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_SYLLABLE_KEY',
      severity: 'error',
    }));
  });

  it('flags duplicate game doors', () => {
    const parsed = mkParsed({
      gameRows: [mkGameRow({ door: 1 }), mkGameRow({ door: 1 })],
    });
    const issues = checkDuplicates(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_GAME_DOOR',
      severity: 'error',
    }));
  });

  it('flags tile self-duplicate distractor', () => {
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a', alt1: 'a' })],
    });
    const issues = checkDuplicates(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'TILE_SELF_DUPLICATE_DISTRACTOR',
    }));
  });
});
