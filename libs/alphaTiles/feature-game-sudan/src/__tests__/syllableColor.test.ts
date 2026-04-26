import { syllableColor } from '../syllableColor';

const COLORS = ['#c0', '#c1', '#c2', '#c3', '#c4', '#c5', '#c6'];

describe('syllableColor', () => {
  it('returns colorList[Number(color)]', () => {
    expect(syllableColor('5', COLORS)).toBe('#c5');
  });

  it('parses leading-zero numeric strings', () => {
    expect(syllableColor('03', COLORS)).toBe('#c3');
  });

  it('returns undefined for non-numeric color (NaN)', () => {
    expect(syllableColor('xyz', COLORS)).toBeUndefined();
  });

  it('returns colorList[0] for blank color (Number("") === 0)', () => {
    // Java would throw NumberFormatException; we keep TS lenient.
    expect(syllableColor('', COLORS)).toBe('#c0');
  });

  it('returns undefined when index out of range', () => {
    expect(syllableColor('99', COLORS)).toBeUndefined();
  });
});
