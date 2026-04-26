import {
  IRAQ_PAGE_SIZE,
  lastPageIndex,
  pageCount,
  tilesForPage,
} from './iraqPagination';

describe('iraqPagination', () => {
  it('PAGE_SIZE is 35 (5x7 grid)', () => {
    expect(IRAQ_PAGE_SIZE).toBe(35);
  });

  it('returns 0 last-page-index for empty list', () => {
    expect(lastPageIndex(0)).toBe(0);
    expect(pageCount(0)).toBe(1);
  });

  it('returns 0 last-page-index for partial first page', () => {
    expect(lastPageIndex(1)).toBe(0);
    expect(lastPageIndex(34)).toBe(0);
    expect(lastPageIndex(35)).toBe(0);
    expect(pageCount(35)).toBe(1);
  });

  it('returns 1 last-page-index for exact-multiple of page size', () => {
    expect(lastPageIndex(36)).toBe(1);
    expect(lastPageIndex(70)).toBe(1);
    expect(pageCount(70)).toBe(2);
  });

  it('matches Java integer division semantics', () => {
    // Java: numPages = (totalTiles - 1) / 35
    expect(lastPageIndex(71)).toBe(2);
    expect(lastPageIndex(105)).toBe(2);
    expect(lastPageIndex(106)).toBe(3);
  });

  it('slices full first page', () => {
    const arr = Array.from({ length: 50 }, (_, i) => i);
    expect(tilesForPage(arr, 0).length).toBe(35);
    expect(tilesForPage(arr, 0)[0]).toBe(0);
  });

  it('slices partial last page', () => {
    const arr = Array.from({ length: 50 }, (_, i) => i);
    const lastPage = tilesForPage(arr, 1);
    expect(lastPage.length).toBe(15);
    expect(lastPage[0]).toBe(35);
  });
});
