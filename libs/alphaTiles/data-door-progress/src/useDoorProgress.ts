import { useCallback, useMemo } from 'react';
import { useDoors } from '@alphaTiles/data-doors';
import type { Door } from '@alphaTiles/data-doors';
import { useProgressStore } from '@alphaTiles/data-progress';
import { useEffectiveSettings } from '@alphaTiles/data-settings';
import { doorProgressOf } from './doorProgressOf';
import { nextUnmasteredDoor } from './nextUnmasteredDoor';
import { recordCorrectAnswer } from './recordCorrectAnswer';

/**
 * One door's progress for one player, live (see `doorProgressOf`), plus:
 * - `recordCorrect(points?)` — `recordCorrectAnswer` with the effective
 *   "After 12 checked trackers" mode; returns the mastery action or null.
 * - `nextDoor()` — `nextUnmasteredDoor` from this door, read at call time.
 *   Play order is the catalogue's file order (difficulty ladder #52: swap in
 *   its tier order here).
 */
export function useDoorProgress(door: Door, playerId: string | null) {
  const all = useProgressStore((state) => state.progress);
  const order = useDoors();
  const { afterTwelveCheckedTrackers } = useEffectiveSettings();

  const progress = useMemo(
    () => doorProgressOf({ door, playerId, progress: all }),
    [door, playerId, all],
  );

  const recordCorrect = useCallback(
    (points?: number) =>
      playerId === null
        ? null
        : recordCorrectAnswer({ door, playerId, points, afterTwelveCheckedTrackers }),
    [door, playerId, afterTwelveCheckedTrackers],
  );

  const nextDoor = useCallback(
    () =>
      nextUnmasteredDoor({ order, from: door, playerId, progress: useProgressStore.getState().progress }),
    [order, door, playerId],
  );

  return { ...progress, recordCorrect, nextDoor };
}
