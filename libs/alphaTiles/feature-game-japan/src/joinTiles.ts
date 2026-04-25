/**
 * Join two adjacent groups by merging group[boundaryIndex] and
 * group[boundaryIndex + 1] into a single group.
 *
 * The boundary between them is removed. Neither group may be locked.
 * Returns the original array unchanged if the boundary is out of range.
 *
 * Port of Japan.java joinTiles().
 */

import type { TileGroup } from './evaluateGroupings';

export function joinTiles(groups: TileGroup[], boundaryIndex: number): TileGroup[] {
  if (boundaryIndex < 0 || boundaryIndex >= groups.length - 1) return groups;

  const left = groups[boundaryIndex];
  const right = groups[boundaryIndex + 1];

  // Never join locked groups
  if (left.isLocked || right.isLocked) return groups;

  const merged: TileGroup = {
    tiles: [...left.tiles, ...right.tiles],
    isLocked: false,
  };

  return [
    ...groups.slice(0, boundaryIndex),
    merged,
    ...groups.slice(boundaryIndex + 2),
  ];
}
