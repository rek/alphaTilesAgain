import { useMemo } from 'react';
import { useDoors } from '@alphaTiles/data-doors';
import { useDoorProgressOf } from '@alphaTiles/data-door-progress';
import { buildMenuDoors } from './buildMenuDoors';

export function useMenuDoors(playerId: string | null) {
  const doors = useDoors();
  const progressOf = useDoorProgressOf(playerId);
  return useMemo(() => buildMenuDoors({ doors, progressOf }), [doors, progressOf]);
}
