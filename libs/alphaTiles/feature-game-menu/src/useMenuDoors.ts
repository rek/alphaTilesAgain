import { useMemo } from 'react';
import { useDoors } from '@alphaTiles/data-doors';
import { buildMenuDoors } from './buildMenuDoors';
import { useTrackerCounts } from './useTrackerCounts';

export function useMenuDoors(playerId: string | null) {
  const doors = useDoors();
  const trackerCounts = useTrackerCounts(playerId);
  return useMemo(
    () => buildMenuDoors({ doors, trackerCounts, playerId }),
    [doors, trackerCounts, playerId],
  );
}
