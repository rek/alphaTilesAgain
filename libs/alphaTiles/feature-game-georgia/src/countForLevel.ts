/**
 * Visible game-button count per challenge level.
 *
 * Java reference: Georgia.java ~108–121 (switch on challengeLevel sets
 * visibleGameButtons). Equivalent to:
 *   level % 3 === 1 → 6   (CL 1, 4, 7, 10)
 *   level % 3 === 2 → 12  (CL 2, 5, 8, 11)
 *   level % 3 === 0 → 18  (CL 3, 6, 9, 12)
 */
export function countForLevel(level: number): 6 | 12 | 18 {
  const m = ((level % 3) + 3) % 3;
  return m === 1 ? 6 : m === 2 ? 12 : 18;
}
