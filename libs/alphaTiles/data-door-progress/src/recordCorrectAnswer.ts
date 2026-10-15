import type { Door } from '@alphaTiles/data-doors';
import { useProgressStore } from '@alphaTiles/data-progress';
import { TRACKERS_PER_DOOR } from './doorProgressOf';
import { masteryActionFor } from './internal/masteryActionFor';

/**
 * Records one correct answer on `door` for `playerId` in the progress store:
 * adds `points`, and — on doors that track progress — checks one tracker.
 * Wrong answers record nothing.
 *
 * Returns the mastery action when this answer checks the 12th tracker (and
 * every 12th after, as Java), else null. The action comes from the pack's
 * "After 12 checked trackers" mode (effective settings
 * `afterTwelveCheckedTrackers`); the caller performs it.
 */
export function recordCorrectAnswer({
  door,
  playerId,
  points = 1,
  afterTwelveCheckedTrackers,
}: {
  door: Door;
  playerId: string;
  points?: number;
  afterTwelveCheckedTrackers: number;
}) {
  const key = door.progressKey(playerId);
  const store = useProgressStore.getState();
  store.incrementPoints(key, points);
  if (!door.tracksProgress) return null;

  store.incrementTracker(key);
  const trackerCount = useProgressStore.getState().progress[key]?.trackerCount ?? 0;
  return trackerCount % TRACKERS_PER_DOOR === 0 ? masteryActionFor(afterTwelveCheckedTrackers) : null;
}
