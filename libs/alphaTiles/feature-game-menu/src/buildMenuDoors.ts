import { ladderOrder } from '@alphaTiles/data-doors';
import type { Door } from '@alphaTiles/data-doors';
import type { DoorProgress } from '@alphaTiles/data-door-progress';

/**
 * Menu view of the Door catalogue: enabled doors only, in difficulty-ladder
 * order (tier, then file order — `ladderOrder`), each with the player's door
 * progress (tracker count, visual state). `index` is the Door's raw row
 * position and is never renumbered by the sort or by a hidden door: it is the
 * door's number badge and the `doorIndex` sent on press (difficulty-ladder D2).
 */
export function buildMenuDoors({
  doors,
  progressOf,
}: {
  doors: Door[];
  progressOf: (door: Door) => Pick<DoorProgress, 'trackerCount' | 'visual'>;
}) {
  return ladderOrder(
    doors
      .filter((door) => door.enabled)
      .map((door) => {
        const { trackerCount, visual } = progressOf(door);
        return {
          ...door,
          trackerCount,
          visual,
          /** No-tracker doors render filled, so their number needs dark text. */
          textColorHex: door.tracksProgress ? undefined : '#000000',
        };
      }),
  );
}

export type MenuDoor = ReturnType<typeof buildMenuDoors>[number];
