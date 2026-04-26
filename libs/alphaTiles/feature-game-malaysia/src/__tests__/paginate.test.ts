import { paginate } from '../paginate';

describe('paginate', () => {
  it('exact-multiple split', () => {
    const xs = [1, 2, 3, 4, 5, 6];
    expect(paginate(xs, 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('partial last page', () => {
    expect(paginate([1, 2, 3, 4, 5], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });

  it('11-per-page across 23 words → 3 pages, last has 1', () => {
    // Matches the spec scenario "Last page renders only the remainder".
    const xs = Array.from({ length: 23 }, (_, i) => i);
    const pages = paginate(xs, 11);
    expect(pages).toHaveLength(3);
    expect(pages[0]).toHaveLength(11);
    expect(pages[1]).toHaveLength(11);
    expect(pages[2]).toHaveLength(1);
    expect(pages[2][0]).toBe(22);
  });

  it('single-page when length <= size', () => {
    expect(paginate([1, 2, 3], 11)).toEqual([[1, 2, 3]]);
  });

  it('empty input → one empty page (numPages === 0)', () => {
    const pages = paginate<number>([], 11);
    expect(pages).toEqual([[]]);
    expect(pages.length - 1).toBe(0);
  });

  it('throws on non-positive size', () => {
    expect(() => paginate([1], 0)).toThrow();
    expect(() => paginate([1], -1)).toThrow();
  });
});
