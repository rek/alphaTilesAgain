import { checkColorReferences } from '../checkColorReferences';
import { mkParsed, mkKeyRow, mkTileRow, mkGameRow, mkColorRow } from '../../__tests__/testHelpers';

describe('checkColorReferences', () => {
  it('no issues when all color references are valid', () => {
    const parsed = mkParsed({
      colorRows: [mkColorRow(0), mkColorRow(1)],
      keyRows: [mkKeyRow('a', '0'), mkKeyRow('b', '1')],
      tileRows: [mkTileRow({ base: 'a', tileColor: '0' })],
      gameRows: [mkGameRow()],
    });
    expect(checkColorReferences(parsed)).toHaveLength(0);
  });

  it('flags out-of-range keyboard color index', () => {
    const parsed = mkParsed({
      colorRows: [mkColorRow(0)], // only index 0 valid
      keyRows: [mkKeyRow('a', '5')],
    });
    const issues = checkColorReferences(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_KEYBOARD_COLOR_INDEX',
      severity: 'error',
    }));
  });

  it('flags out-of-range tile color index', () => {
    const parsed = mkParsed({
      colorRows: [mkColorRow(0)],
      tileRows: [mkTileRow({ base: 'a', tileColor: '99' })],
    });
    const issues = checkColorReferences(parsed);
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'INVALID_TILE_COLOR_INDEX',
      severity: 'error',
    }));
  });
});
