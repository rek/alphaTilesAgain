import { useCallback } from 'react';
import type { Door } from '@alphaTiles/data-doors';
import { useProgressStore } from '@alphaTiles/data-progress';
import { doorProgressOf } from './doorProgressOf';

/**
 * `(door) => DoorProgress` for one player (see `doorProgressOf`), live from
 * the progress store: the function changes whenever progress does. For views
 * over many doors (menu; the difficulty ladder's placement).
 */
export function useDoorProgressOf(playerId: string | null) {
  const progress = useProgressStore((state) => state.progress);
  return useCallback(
    (door: Door) => doorProgressOf({ door, playerId, progress }),
    [playerId, progress],
  );
}
