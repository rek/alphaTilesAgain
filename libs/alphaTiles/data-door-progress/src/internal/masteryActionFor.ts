/**
 * The pack's "After 12 checked trackers" mode (effective setting
 * `afterTwelveCheckedTrackers`; blank / non-numeric → 3) as an action.
 * GameActivity.java:316-412:
 *   1 → keep playing.
 *   2 → back to the menu after the correct chime (again every 12 more).
 *   3 → celebration, then the next unmastered door.
 * Any other number matches none of Java's branches: keep playing.
 */
export function masteryActionFor(afterTwelveCheckedTrackers: number) {
  if (afterTwelveCheckedTrackers === 2) return 'return-to-menu' as const;
  if (afterTwelveCheckedTrackers === 3) return 'celebrate-then-next-door' as const;
  return 'keep-playing' as const;
}

export type MasteryAction = ReturnType<typeof masteryActionFor>;
