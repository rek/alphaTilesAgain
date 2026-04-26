/**
 * Peel a single tile off its joined group.
 *
 * Faithful port of Japan.java separateTiles() (lines 253-444): tapping a tile
 * restores ONLY the link button(s) adjacent to the clicked tile. Other tiles
 * in the same group remain joined.
 *
 * - Edge tile (first or last in group): one inward-facing link button restored
 *   -> the clicked tile becomes its own group; the rest stay joined.
 * - Interior tile (joined on both sides): BOTH adjacent link buttons restored
 *   -> clicked tile becomes its own group; left and right segments each become
 *   their own groups.
 *
 * Single-tile groups and locked groups are no-ops.
 */

import type { TileGroup } from './evaluateGroupings';

export function separateTiles(
  groups: TileGroup[],
  groupIndex: number,
  tilePositionInGroup = 0,
): TileGroup[] {
  if (groupIndex < 0 || groupIndex >= groups.length) return groups;

  const group = groups[groupIndex];
  if (group.isLocked || group.tiles.length <= 1) return groups;
  if (tilePositionInGroup < 0 || tilePositionInGroup >= group.tiles.length) {
    return groups;
  }

  const left = group.tiles.slice(0, tilePositionInGroup);
  const middle = [group.tiles[tilePositionInGroup]];
  const right = group.tiles.slice(tilePositionInGroup + 1);

  const inserted: TileGroup[] = [];
  if (left.length > 0) inserted.push({ tiles: left, isLocked: false });
  inserted.push({ tiles: middle, isLocked: false });
  if (right.length > 0) inserted.push({ tiles: right, isLocked: false });

  return [
    ...groups.slice(0, groupIndex),
    ...inserted,
    ...groups.slice(groupIndex + 1),
  ];
}
