import { pickTaiwanCharacters } from './pickTaiwanCharacters';

describe('pickTaiwanCharacters', () => {
  it('returns goalCount unique chars when pool is large enough', () => {
    const out = pickTaiwanCharacters(['醫', '生', '護', '士', '檢', '查'], 5, mkRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]));
    expect(out).toHaveLength(5);
    expect(new Set(out).size).toBe(5);
    out.forEach((c) => expect(['醫', '生', '護', '士', '檢', '查']).toContain(c));
  });

  it('returns whatever is there when pool < goalCount', () => {
    const out = pickTaiwanCharacters(['醫', '生'], 5, mkRng([0, 0, 0]));
    expect(out).toHaveLength(2);
    expect(new Set(out)).toEqual(new Set(['醫', '生']));
  });

  it('is deterministic with injected rng', () => {
    const seed = [0.1, 0.5, 0.9, 0.2, 0.7, 0.3];
    const a = pickTaiwanCharacters(['醫', '生', '護', '士'], 3, mkRng(seed));
    const b = pickTaiwanCharacters(['醫', '生', '護', '士'], 3, mkRng(seed));
    expect(a).toEqual(b);
  });

  it('returns [] when goalCount <= 0', () => {
    expect(pickTaiwanCharacters(['醫'], 0)).toEqual([]);
    expect(pickTaiwanCharacters(['醫'], -1)).toEqual([]);
  });

  it('returns [] when pool is empty', () => {
    expect(pickTaiwanCharacters([], 5)).toEqual([]);
  });
});

function mkRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
