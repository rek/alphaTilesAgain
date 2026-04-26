import { verifyFreshTile } from '../verifyFreshTile';

describe('verifyFreshTile', () => {
  it('accepts a fresh candidate', () => {
    expect(verifyFreshTile('x', ['a', 'b', 'c'], 0)).toBe(true);
  });

  it('rejects a candidate matching the most-recent ref', () => {
    expect(verifyFreshTile('a', ['a', 'b', 'c'], 0)).toBe(false);
  });

  it('rejects matches case-insensitively', () => {
    expect(verifyFreshTile('A', ['a'], 0)).toBe(false);
    expect(verifyFreshTile('a', ['A'], 0)).toBe(false);
    expect(verifyFreshTile('Foo', ['fOO'], 0)).toBe(false);
  });

  it('rejects matches anywhere in the last-3 window', () => {
    expect(verifyFreshTile('c', ['a', 'b', 'c'], 0)).toBe(false);
    expect(verifyFreshTile('b', ['a', 'b', 'c'], 0)).toBe(false);
  });

  it('accepts after 25 retries even when the candidate matches', () => {
    expect(verifyFreshTile('a', ['a'], 26)).toBe(true);
  });

  it('still rejects on retry 25 (boundary: > 25)', () => {
    expect(verifyFreshTile('a', ['a'], 25)).toBe(false);
  });

  it('handles empty recent list', () => {
    expect(verifyFreshTile('anything', [], 0)).toBe(true);
  });
});
