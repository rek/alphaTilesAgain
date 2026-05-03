/**
 * Pick `goalCount` distinct characters from `availableTiles` for one round.
 *
 * - If `availableTiles.length <= goalCount`, returns all of them in shuffled order.
 * - Otherwise returns a random sample without replacement.
 * - Deterministic when `rng` is provided.
 */
export function pickTaiwanCharacters(
  availableTiles: readonly string[],
  goalCount: number,
  rng: () => number = Math.random,
): string[] {
  if (goalCount <= 0 || availableTiles.length === 0) return [];

  const pool = [...availableTiles];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(goalCount, pool.length));
}
