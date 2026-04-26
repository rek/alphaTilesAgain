/**
 * Java parity: `Thailand.verifyFreshTile` (lines 424-435).
 *
 * Returns true when `candidate` may be used as the next ref string. Rejects
 * any candidate that case-insensitively matches one of the previous up-to-3
 * ref strings, UNLESS we have already retried more than 25 times (in which
 * case we give up and accept the candidate so the picker cannot deadlock on
 * a small tile/word pool).
 */
export function verifyFreshTile(
  candidate: string,
  recent: readonly string[],
  freshChecks: number,
): boolean {
  if (freshChecks > 25) return true;
  const lower = candidate.toLowerCase();
  for (const r of recent) {
    if (r.toLowerCase() === lower) return false;
  }
  return true;
}
