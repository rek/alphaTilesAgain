/**
 * Row background color for the Malaysia screen.
 *
 * Pyramid pattern matches Malaysia.java line 107:
 *   int color = i<5 ? i : i>5 ? 10-i : 7;
 * which yields, for i = 0..10, the indices [0,1,2,3,4,7,4,3,2,1,0].
 *
 * When `colorless === true`, every row uses `colorList[8]` regardless of
 * row index (Malaysia.java line 108: `colorList.get(colorless ? 8 : color)`).
 *
 * If a page has fewer than 11 rows, only the first N pyramid entries are used
 * (Java loops only over `visibleGameButtons`, line 103).
 */

export const PAGE_SIZE = 11;

/** Indices into colorList for rows 0..10. */
export const COLOR_INDEX_PYRAMID: ReadonlyArray<number> = [
  0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0,
];

/** Index into colorList used when colorless mode is active. */
export const COLORLESS_INDEX = 8;

export function rowColorIndex(rowIndex: number, colorless: boolean): number {
  if (colorless) return COLORLESS_INDEX;
  if (rowIndex < 0 || rowIndex >= COLOR_INDEX_PYRAMID.length) {
    throw new Error(
      `rowColorIndex: rowIndex ${rowIndex} out of range [0, ${COLOR_INDEX_PYRAMID.length})`,
    );
  }
  return COLOR_INDEX_PYRAMID[rowIndex];
}

export function rowColor(
  rowIndex: number,
  colorList: ReadonlyArray<string>,
  colorless: boolean,
): string {
  const idx = rowColorIndex(rowIndex, colorless);
  // Defensive fallback: very short colorList. Java would throw IndexOutOfBounds
  // — we degrade to the last available entry instead of crashing the screen.
  return colorList[idx] ?? colorList[colorList.length - 1] ?? '#000000';
}
