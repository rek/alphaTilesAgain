import type { Door } from '@alphaTiles/data-doors';
import type { ProgressEntry } from '@alphaTiles/data-progress';
import { doorProgressOf } from './doorProgressOf';

/**
 * Where mastery mode 3 sends the player: the first door after `from` in
 * `order`, wrapping, that is enabled and not mastered (`doorProgressOf`).
 * Ports GameActivity.java:356-411's search, plus "never a hidden door".
 *
 * `order` is the play order — today the Door catalogue's file order; the
 * difficulty ladder (#52) passes its tier-sorted sequence. Doors are matched
 * by `index`, never by position, so any order works. `from` itself is
 * checked last. Null when every enabled door is mastered (→ menu).
 */
export function nextUnmasteredDoor({
  order,
  from,
  playerId,
  progress,
}: {
  order: Door[];
  from: Door;
  playerId: string | null;
  progress: Record<string, ProgressEntry>;
}): Door | null {
  const start = order.findIndex((door) => door.index === from.index);
  for (let step = 1; step <= order.length; step++) {
    const door = order[(start + step) % order.length];
    if (door.enabled && !doorProgressOf({ door, playerId, progress }).mastered) return door;
  }
  return null;
}
