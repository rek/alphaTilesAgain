import type { Door } from '@alphaTiles/data-doors';
import { deriveVisual } from './deriveVisual';

/**
 * Menu view of the Door catalogue: enabled doors only, in file order, each
 * with the player's tracker count and its visual state. `index` is the Door's
 * raw row position, so a hidden door leaves a gap rather than shifting later
 * doors onto the wrong row.
 */
export function buildMenuDoors({
  doors,
  trackerCounts,
  playerId,
}: {
  doors: Door[];
  trackerCounts: Record<string, number>;
  playerId: string | null;
}) {
  return doors
    .filter((door) => door.enabled)
    .map((door) => {
      const trackerCount = playerId ? (trackerCounts[door.progressKey(playerId)] ?? 0) : 0;
      return {
        ...door,
        trackerCount,
        visual: deriveVisual({ tracksProgress: door.tracksProgress, trackerCount }),
        /** No-tracker doors render filled, so their number needs dark text. */
        textColorHex: door.tracksProgress ? undefined : '#000000',
      };
    });
}

export type MenuDoor = ReturnType<typeof buildMenuDoors>[number];
