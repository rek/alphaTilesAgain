import { matchPath } from '../matchPath';

const placed = [
  { path: [0, 1, 2, 3] },
  { path: [10, 17, 24] },
  { path: [48, 41, 34, 27] },
];

describe('matchPath', () => {
  it('finds forward match', () => {
    expect(matchPath({ candidate: [0, 1, 2, 3], paths: placed })).toBe(0);
  });

  it('finds reverse match', () => {
    expect(matchPath({ candidate: [3, 2, 1, 0], paths: placed })).toBe(0);
  });

  it('matches a 3-long diagonal placed path', () => {
    expect(matchPath({ candidate: [10, 17, 24], paths: placed })).toBe(1);
  });

  it('returns -1 for no match', () => {
    expect(matchPath({ candidate: [5, 6, 7], paths: placed })).toBe(-1);
  });

  it('returns -1 for length mismatch', () => {
    expect(matchPath({ candidate: [0, 1, 2], paths: placed })).toBe(-1);
  });
});
