import {
  COLOR_INDEX_PYRAMID,
  COLORLESS_INDEX,
  PAGE_SIZE,
  rowColor,
  rowColorIndex,
} from '../rowColor';

const PALETTE = [
  '#c00', '#c10', '#c20', '#c30', '#c40', '#c50', '#c60', '#c70', '#c80',
];

describe('rowColorIndex / rowColor', () => {
  it('PAGE_SIZE === 11', () => {
    expect(PAGE_SIZE).toBe(11);
  });

  it('pyramid is exactly [0,1,2,3,4,7,4,3,2,1,0]', () => {
    expect(COLOR_INDEX_PYRAMID).toEqual([0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]);
    expect(COLOR_INDEX_PYRAMID).toHaveLength(PAGE_SIZE);
  });

  it('row index 5 (apex) uses colorList[7]', () => {
    expect(rowColorIndex(5, false)).toBe(7);
    expect(rowColor(5, PALETTE, false)).toBe(PALETTE[7]);
  });

  it('rows 0..10 follow the pyramid pattern', () => {
    for (let i = 0; i < PAGE_SIZE; i++) {
      expect(rowColorIndex(i, false)).toBe(COLOR_INDEX_PYRAMID[i]);
      expect(rowColor(i, PALETTE, false)).toBe(PALETTE[COLOR_INDEX_PYRAMID[i]]);
    }
  });

  it('mirrors around the apex (rowColorIndex(i) === rowColorIndex(10-i))', () => {
    for (let i = 0; i <= 4; i++) {
      expect(rowColorIndex(i, false)).toBe(rowColorIndex(PAGE_SIZE - 1 - i, false));
    }
  });

  it('colorless=true → COLORLESS_INDEX (8) for every row', () => {
    expect(COLORLESS_INDEX).toBe(8);
    for (let i = 0; i < PAGE_SIZE; i++) {
      expect(rowColorIndex(i, true)).toBe(COLORLESS_INDEX);
      expect(rowColor(i, PALETTE, true)).toBe(PALETTE[COLORLESS_INDEX]);
    }
  });

  it('throws for out-of-range rowIndex when not colorless', () => {
    expect(() => rowColorIndex(-1, false)).toThrow();
    expect(() => rowColorIndex(PAGE_SIZE, false)).toThrow();
  });

  it('does not throw for out-of-range rowIndex when colorless (always 8)', () => {
    expect(rowColorIndex(99, true)).toBe(COLORLESS_INDEX);
  });

  it('falls back to last palette entry if colorList is too short', () => {
    expect(rowColor(5, ['#a', '#b'], false)).toBe('#b');
  });
});
