import { pickTaiwanCharacters } from './pickTaiwanCharacters';

describe('pickTaiwanCharacters', () => {
  it('returns the first goalCount chars in order at offset 0', () => {
    const pool = ['一', '二', '三', '四', '五', '六', '七'];
    expect(pickTaiwanCharacters(pool, 5, 0)).toEqual(['一', '二', '三', '四', '五']);
  });

  it('advances by goalCount per offset (simple → complex progression)', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    expect(pickTaiwanCharacters(pool, 5, 1)).toEqual(['f', 'g', 'h', 'i', 'j']);
  });

  it('wraps around the pool when offset exceeds length', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
    // offset 1 starts at index 5, wraps: f, a, b, c, d
    expect(pickTaiwanCharacters(pool, 5, 1)).toEqual(['f', 'a', 'b', 'c', 'd']);
  });

  it('returns whatever is there when pool < goalCount', () => {
    expect(pickTaiwanCharacters(['醫', '生'], 5, 0)).toEqual(['醫', '生']);
    expect(pickTaiwanCharacters(['醫', '生'], 5, 3)).toEqual(['醫', '生']);
  });

  it('returns [] when goalCount <= 0', () => {
    expect(pickTaiwanCharacters(['醫'], 0)).toEqual([]);
    expect(pickTaiwanCharacters(['醫'], -1)).toEqual([]);
  });

  it('returns [] when pool is empty', () => {
    expect(pickTaiwanCharacters([], 5)).toEqual([]);
  });

  it('defaults offset to 0', () => {
    expect(pickTaiwanCharacters(['a', 'b', 'c', 'd', 'e', 'f'], 3)).toEqual(['a', 'b', 'c']);
  });
});
