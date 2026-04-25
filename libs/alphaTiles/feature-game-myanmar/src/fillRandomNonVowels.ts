// Fill empty (null) cells of the placement grid with random non-vowel tiles.
// Java Myanmar.java only excludes typeOfThisTileInstance.equals("V").
// LV/AV/BV/FV are NOT excluded — preserve upstream behavior verbatim.
export function fillRandomNonVowels({
  grid,
  tilePool,
  rng,
}: {
  grid: (string | null)[];
  // tilePool corresponds to Java's tileListNoSAD: tile list minus space/auto/dummy types.
  tilePool: ReadonlyArray<{ base: string; type: string }>;
  rng: () => number;
}): string[] {
  const nonVowels = tilePool.filter((t) => t.type !== 'V');
  if (nonVowels.length === 0) {
    throw new Error('fillRandomNonVowels: no non-vowel tiles available');
  }
  const out = grid.slice() as (string | null)[];
  for (let i = 0; i < out.length; i++) {
    if (out[i] === null) {
      const pick = nonVowels[Math.floor(rng() * nonVowels.length)];
      out[i] = pick.base;
    }
  }
  return out as string[];
}
