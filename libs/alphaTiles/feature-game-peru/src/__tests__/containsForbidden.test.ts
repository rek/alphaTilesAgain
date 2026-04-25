import { containsForbidden } from '../containsForbidden';

describe('containsForbidden', () => {
  it('returns true when string contains للہ', () => {
    expect(containsForbidden('xللہy')).toBe(true);
    expect(containsForbidden('للہ')).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(containsForbidden('cat')).toBe(false);
    expect(containsForbidden('')).toBe(false);
  });
});
