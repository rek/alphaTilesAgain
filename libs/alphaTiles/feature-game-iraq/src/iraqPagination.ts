/**
 * Iraq pagination math.
 *
 * Port of `Iraq.java:37, 126` — 35 tiles per page, 5x7 grid.
 * `numPages = (totalTiles - 1) / tilesPerPage` (integer division → 0-based last index).
 */

export const IRAQ_PAGE_SIZE = 35;
export const IRAQ_GRID_ROWS = 5;
export const IRAQ_GRID_COLUMNS = 7;

/** 0-based index of the last page. Returns 0 for empty lists (Java behaviour). */
export function lastPageIndex(totalTiles: number): number {
  if (totalTiles <= 0) return 0;
  return Math.floor((totalTiles - 1) / IRAQ_PAGE_SIZE);
}

/** Total number of pages (always >= 1). */
export function pageCount(totalTiles: number): number {
  return lastPageIndex(totalTiles) + 1;
}

/** Slice of tiles to render on `pageIndex`. */
export function tilesForPage<T>(tiles: T[], pageIndex: number): T[] {
  const start = pageIndex * IRAQ_PAGE_SIZE;
  return tiles.slice(start, start + IRAQ_PAGE_SIZE);
}
