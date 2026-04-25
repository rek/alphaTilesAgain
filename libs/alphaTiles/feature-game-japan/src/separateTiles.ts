/**
 * Separate a group back into individual single-tile groups.
 *
 * Tapping a joined (non-locked) group restores all link buttons on either
 * side by splitting all its tiles back into individual groups.
 *
 * Port of Japan.java separateTiles().
 */

import type { TileGroup } from './evaluateGroupings';

export function separateTiles(groups: TileGroup[], groupIndex: number): TileGroup[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;

  const group = groups[groupIndex];

  // Cannot separate a locked group or a single-tile group
  if (group.isLocked || group.tiles.length <= 1) return groups;

  const separated: TileGroup[] = group.tiles.map((tile) => ({
    tiles: [tile],
    isLocked: false,
  }));

  return [
    ...groups.slice(0, groupIndex),
    ...separated,
    ...groups.slice(groupIndex + 1),
  ];
}
