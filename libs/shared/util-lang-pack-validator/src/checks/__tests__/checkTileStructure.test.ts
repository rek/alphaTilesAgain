import { checkTileStructure } from '../checkTileStructure';
import { mkParsed, mkTileRow } from '../../__tests__/testHelpers';

describe('checkTileStructure', () => {
  it('no issues on valid tiles', () => {
    const parsed = mkParsed({
      tileRows: [
        mkTileRow({ base: 'a', type: 'V', alt1: 'b', alt2: 'c', alt3: 'd' }),
        mkTileRow({ base: 'b', type: 'C', alt1: 'a', alt2: 'c', alt3: 'd' }),
        mkTileRow({ base: 'c', type: 'C', alt1: 'a', alt2: 'b', alt3: 'd' }),
        mkTileRow({ base: 'd', type: 'C', alt1: 'a', alt2: 'b', alt3: 'c' }),
      ],
    });
    expect(checkTileStructure(parsed)).toHaveLength(0);
  });

  it('flags invalid tile type', () => {
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a', type: 'Z' })],
    });
    const issues = checkTileStructure(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_TILE_TYPE',
      severity: 'error',
    }));
  });

  it('flags distractor not in tile list', () => {
    const parsed = mkParsed({
      tileRows: [mkTileRow({ base: 'a', alt1: 'z' })], // 'z' not in tile list
    });
    const issues = checkTileStructure(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_DISTRACTOR',
      severity: 'error',
    }));
  });
});
