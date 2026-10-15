import type { Door } from '@alphaTiles/data-doors';

/**
 * Route for a pressed menu door — exactly `{ classKey, doorIndex, challengeLevel }`
 * (game-menu "Door-press navigation contract"). `doorIndex` is the door's raw
 * row `index`, never its grid position (difficulty-ladder D2).
 */
export function doorHref(door: Pick<Door, 'classKey' | 'index' | 'challengeLevel'>) {
  return {
    pathname: '/games/[classKey]' as const,
    params: {
      classKey: door.classKey,
      doorIndex: String(door.index),
      challengeLevel: String(door.challengeLevel),
    },
  };
}
