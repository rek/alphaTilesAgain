/**
 * Finds the next enabled door (file order, wrapping) the given player has not
 * mastered (checked12Trackers === false). Hidden doors (`enabled: false`, e.g.
 * Taiwan without stroke data) are never returned — the menu doesn't show them.
 *
 * Ports GameActivity.java:356-411 — the while-loop inside the Timer callback
 * that iterates through gameList to find the next uncompleted game.
 *
 * Returns the Door, or null if every door is done.
 */

import type { Door } from '@alphaTiles/data-doors';
import type { ProgressEntry } from '@alphaTiles/data-progress';

export function findNextUncompletedGame(
  doors: Door[],
  fromIndex: number, // current door's 1-based index
  progress: Record<string, ProgressEntry>,
  playerId: string,
): Door | null {
  const total = doors.length;
  let current = fromIndex;

  for (let repeat = 0; repeat < total; repeat++) {
    // Advance to next (wrap around)
    current = current < total ? current + 1 : 1;
    const door = doors[current - 1];
    if (door.enabled && !progress[door.progressKey(playerId)]?.checked12Trackers) return door;
  }

  // All games completed
  return null;
}
