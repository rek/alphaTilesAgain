import type { Door } from '@alphaTiles/data-doors';
import type { ProgressEntry } from '@alphaTiles/data-progress';

/** Trackers on the shell's tracker bar; checking all of them masters a door. */
export const TRACKERS_PER_DOOR = 12;

/**
 * Door progress: one player's standing on one Door — the ONE place that says
 * what "mastered" means. Menu (door visual), game shell (tracker bar, score,
 * mastery action) and the next-door search all read it.
 *
 * Mastered = the door tracks progress AND its tracker count is ≥ 12, in every
 * "After 12 checked trackers" mode (Java `GameActivity.updatePointsAndTrackers`
 * sets `hasChecked12Trackers` at `trackerCount >= 12`; `Earth.updateDoors`
 * draws mastery at the same count). The tracker bar checks icon `t` while
 * `t < trackerCount`, so it stays full past 12.
 *
 * No-right/wrong doors (`tracksProgress: false`) are never mastered and
 * always show "in process" (Java Earth forces their count to 12 for colour,
 * but never sets the flag, so Java's next-game search can still pick them).
 */
export function doorProgressOf({
  door,
  playerId,
  progress,
}: {
  door: Door;
  /** No player → empty progress. */
  playerId: string | null;
  progress: Record<string, ProgressEntry>;
}) {
  const entry = playerId === null ? undefined : progress[door.progressKey(playerId)];
  const trackerCount = entry?.trackerCount ?? 0;
  const mastered = door.tracksProgress && trackerCount >= TRACKERS_PER_DOOR;
  const visual: 'not-started' | 'in-process' | 'mastery' = !door.tracksProgress
    ? 'in-process'
    : mastered
      ? 'mastery'
      : trackerCount > 0
        ? 'in-process'
        : 'not-started';

  return {
    points: entry?.points ?? 0,
    /** Correct answers so far; keeps counting past 12. */
    trackerCount,
    /** The tracker bar, left to right: `true` = checked. Full once mastered. */
    trackers: Array.from({ length: TRACKERS_PER_DOOR }, (_, i) => i < trackerCount),
    mastered,
    /** Menu door state. */
    visual,
  };
}

export type DoorProgress = ReturnType<typeof doorProgressOf>;
