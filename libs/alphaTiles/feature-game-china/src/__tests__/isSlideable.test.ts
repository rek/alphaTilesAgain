import { isSlideable } from '../isSlideable';

// 4×4 board layout:
// 0  1  2  3
// 4  5  6  7
// 8  9  10 11
// 12 13 14 15

describe('isSlideable', () => {
  it('center tile is slideable when blank is above', () => {
    // tile=5, blank=1 (directly above in same column)
    expect(isSlideable(5, 1)).toBe(true);
  });

  it('center tile is slideable when blank is below', () => {
    expect(isSlideable(5, 9)).toBe(true);
  });

  it('center tile is slideable when blank is to the left', () => {
    expect(isSlideable(5, 4)).toBe(true);
  });

  it('center tile is slideable when blank is to the right', () => {
    expect(isSlideable(5, 6)).toBe(true);
  });

  it('center tile is not slideable when blank is diagonal', () => {
    expect(isSlideable(5, 0)).toBe(false);
    expect(isSlideable(5, 10)).toBe(false);
  });

  it('corner 0: no left, no up wrap; slideable right and down', () => {
    expect(isSlideable(0, 1)).toBe(true);
    expect(isSlideable(0, 4)).toBe(true);
    // left would be -1: no neighbor
    expect(isSlideable(0, 3)).toBe(false); // far right of row
  });

  it('corner 3 (top-right): not slideable to index 4 (different row)', () => {
    // index 3 is rightmost column; index 4 is leftmost of next row — no right wrap
    expect(isSlideable(3, 4)).toBe(false);
    expect(isSlideable(3, 2)).toBe(true);
    expect(isSlideable(3, 7)).toBe(true);
  });

  it('corner 12 (bottom-left): not slideable to index 11 (different row)', () => {
    // index 12 is leftmost; index 11 is rightmost of row above — no left wrap
    expect(isSlideable(12, 11)).toBe(false);
    expect(isSlideable(12, 13)).toBe(true);
    expect(isSlideable(12, 8)).toBe(true);
  });

  it('corner 15 (bottom-right): slideable only up and left', () => {
    expect(isSlideable(15, 11)).toBe(true);
    expect(isSlideable(15, 14)).toBe(true);
    expect(isSlideable(15, 16)).toBe(false); // out of bounds
  });

  it('not slideable when blank is not adjacent', () => {
    expect(isSlideable(0, 15)).toBe(false);
    expect(isSlideable(7, 12)).toBe(false);
  });

  it('not slideable when index === blankIndex', () => {
    expect(isSlideable(5, 5)).toBe(false);
  });
});
