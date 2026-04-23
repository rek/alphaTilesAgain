import type { StageTile } from './types';

// Ports Start.java buildTileStagesLists (line 378).
// result[i] = tiles whose stageOfFirstAppearance === i+1. Length always 7.
export function tileStagesLists<T extends StageTile>(
  tileList: T[],
  getStage: (tile: T) => number = (t) => t.stageOfFirstAppearance,
): T[][] {
  const result: T[][] = Array.from({ length: 7 }, () => []);
  for (const tile of tileList) {
    const stage = getStage(tile);
    if (stage >= 1 && stage <= 7) {
      result[stage - 1].push(tile);
    }
  }
  return result;
}
