import { useMemo } from 'react';
import { ladderOrder } from './ladderOrder';
import { useDoors } from './useDoors';

/** Every Door in difficulty-ladder order (see `ladderOrder`) — the play order. Stable for the session. */
export function useLadderDoors() {
  const doors = useDoors();
  return useMemo(() => ladderOrder(doors), [doors]);
}
