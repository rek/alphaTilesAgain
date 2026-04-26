/**
 * Distribute a flat list into fixed-size pages, left-to-right.
 *
 * Port of Malaysia.java:assignPages (lines 80-89) — a forward fill across
 * pages of `wordsPerPage = GAME_BUTTONS.length` (which is 11).
 *
 * The last page may be partial. An empty input returns a single empty page
 * so callers always have `pages.length >= 1` and `numPages = pages.length - 1`
 * (matches Java's 0-based `currentPageNumber` semantics).
 */
export function paginate<T>(xs: ReadonlyArray<T>, size: number): T[][] {
  if (size <= 0) throw new Error(`paginate: size must be > 0 (got ${size})`);
  if (xs.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) {
    out.push(xs.slice(i, i + size));
  }
  return out;
}
