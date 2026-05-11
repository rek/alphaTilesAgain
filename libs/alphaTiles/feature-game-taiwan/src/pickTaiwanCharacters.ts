/**
 * Sequential window into `availableTiles`. Returns `goalCount` chars starting
 * at `offset * goalCount`, wrapping around when the offset exceeds the pool.
 *
 * `availableTiles` is pre-sorted by stroke count ascending (see
 * `buildTaiwanData.ts`), so successive rounds walk simple → complex (issue
 * #20). Wrap restarts from the easiest character.
 *
 * - If `availableTiles.length <= goalCount`, returns all of them in order.
 */
export function pickTaiwanCharacters(
  availableTiles: readonly string[],
  goalCount: number,
  offset = 0,
): string[] {
  if (goalCount <= 0 || availableTiles.length === 0) return [];
  if (availableTiles.length <= goalCount) return [...availableTiles];

  const start = ((offset * goalCount) % availableTiles.length + availableTiles.length) % availableTiles.length;
  const out: string[] = [];
  for (let i = 0; i < goalCount; i++) {
    out.push(availableTiles[(start + i) % availableTiles.length]);
  }
  return out;
}
