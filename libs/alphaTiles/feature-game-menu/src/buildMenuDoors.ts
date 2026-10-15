import type { Door } from '@alphaTiles/data-doors';
import type { DoorProgress } from '@alphaTiles/data-door-progress';

/**
 * Menu view of the Door catalogue: enabled doors only, in file order, each
 * with the player's door progress (tracker count, visual state). `index` is
 * the Door's raw row position, so a hidden door leaves a gap rather than
 * shifting later doors onto the wrong row.
 */
export function buildMenuDoors({
  doors,
  progressOf,
}: {
  doors: Door[];
  progressOf: (door: Door) => Pick<DoorProgress, 'trackerCount' | 'visual'>;
}) {
  return doors
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
    });
}

export type MenuDoor = ReturnType<typeof buildMenuDoors>[number];
