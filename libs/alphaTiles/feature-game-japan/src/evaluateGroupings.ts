/**
 * Partial-credit evaluation walking the interleaved currentViews sequence.
 *
 * Faithful port of Japan.java evaluateCombination() lines 478-525.
 *
 * Algorithm:
 *   - Build `currentViews` from groups: alternating tiles + remaining link
 *     buttons (link button between groups[i] and groups[i+1] is "present").
 *   - Compute `correctBoundaryTilePositions`: 0-based absolute tile indices k
 *     such that the boundary between tile[k] and tile[k+1] is a correct
 *     syllable boundary (k = sum of tile counts in syllables 0..i for the i-th
 *     internal boundary).
 *   - Walk currentViews; track a sentinel `firstBoundary` (initially -1, the
 *     row-start sentinel — Java uses currentViews.get(0), a tile, as a
 *     placeholder that means "no preceding correct link button"). For each
 *     link button encountered:
 *       - If NOT a correct boundary -> break the chain (clear intermediate).
 *       - If IS a correct boundary AND building AND the previous correct
 *         boundary in `firstBoundary` is the immediate predecessor in
 *         correctBoundaryTilePositions (or `firstBoundary` is the row-start
 *         sentinel for the very first syllable) -> lock the intermediate
 *         tiles AND lock the bookend boundary(ies).
 *     For each tile encountered while building, add to intermediate.
 *   - After the walk, also lock the final-syllable trailing tiles when
 *     `firstBoundary` is the last correct boundary (row-end sentinel).
 *
 * Returns sets of locked absolute tile indices and locked boundary indices.
 */

export type TileGroup = {
  tiles: string[];
  isLocked: boolean;
};

export type EvaluationResult = {
  /** Absolute tile indices (0..N-1) that are locked. */
  lockedTiles: Set<number>;
  /** Absolute boundary indices (0..N-2) whose link button is locked. */
  lockedBoundaries: Set<number>;
};

type View =
  | { kind: 'tile'; tileIndex: number; text: string }
  | { kind: 'link'; boundaryIndex: number };

/** Build the interleaved currentViews sequence from group state. */
function buildCurrentViews(groups: TileGroup[]): View[] {
  const views: View[] = [];
  let absoluteTile = 0;
  let lastTileOfPrevGroup = -1;
  for (let g = 0; g < groups.length; g++) {
    if (g > 0) {
      views.push({ kind: 'link', boundaryIndex: lastTileOfPrevGroup });
    }
    for (let t = 0; t < groups[g].tiles.length; t++) {
      views.push({
        kind: 'tile',
        tileIndex: absoluteTile,
        text: groups[g].tiles[t],
      });
      absoluteTile++;
      if (t === groups[g].tiles.length - 1) {
        lastTileOfPrevGroup = absoluteTile - 1;
      }
    }
  }
  return views;
}

/**
 * Convert correct syllable tile arrays to a list of internal-boundary
 * absolute-tile-indices. For syllable counts [2, 1, 3], boundaries fall after
 * tile indices [1, 2] (i.e. between tile 1<->2 and tile 2<->3).
 */
function correctBoundaryIndices(correctSyllables: string[][]): number[] {
  const result: number[] = [];
  let cum = 0;
  for (let i = 0; i < correctSyllables.length - 1; i++) {
    cum += correctSyllables[i].length;
    result.push(cum - 1);
  }
  return result;
}

export function evaluateGroupings(
  groups: TileGroup[],
  correctSyllables: string[][],
): EvaluationResult {
  const lockedTiles = new Set<number>();
  const lockedBoundaries = new Set<number>();

  const totalTiles = correctSyllables.reduce((s, arr) => s + arr.length, 0);
  const correctBoundaries = correctBoundaryIndices(correctSyllables);
  const correctBoundarySet = new Set(correctBoundaries);

  const currentViews = buildCurrentViews(groups);
  if (currentViews.length === 0) return { lockedTiles, lockedBoundaries };

  // Sentinel: -1 means "row start" (first syllable's left bookend is implicit).
  // Java seeds firstLinkButton = currentViews.get(0) (a tile) and skips the
  // pair check via secondLinkButtonIndex > 0; we mirror with -1 sentinel.
  const ROW_START = -1;
  let firstBoundary: number = ROW_START;
  let buildingIntermediate = true;
  let intermediateTiles: number[] = [];

  for (const view of currentViews) {
    if (view.kind === 'link') {
      if (!correctBoundarySet.has(view.boundaryIndex)) {
        intermediateTiles = [];
        buildingIntermediate = false;
      } else if (buildingIntermediate) {
        const secondIdx = correctBoundaries.indexOf(view.boundaryIndex);
        let pairComplete: boolean;
        if (secondIdx > 0) {
          pairComplete = correctBoundaries[secondIdx - 1] === firstBoundary;
        } else {
          pairComplete = firstBoundary === ROW_START;
        }
        // Java guard: prevent locking the entire word via partial credit.
        if (pairComplete && intermediateTiles.length !== totalTiles) {
          for (const t of intermediateTiles) lockedTiles.add(t);
          lockedBoundaries.add(view.boundaryIndex);
          if (firstBoundary !== ROW_START) lockedBoundaries.add(firstBoundary);
        }
        firstBoundary = view.boundaryIndex;
        intermediateTiles = [];
      } else {
        // Correct boundary encountered after a chain break - restart.
        buildingIntermediate = true;
        firstBoundary = view.boundaryIndex;
        intermediateTiles = [];
      }
    } else if (buildingIntermediate) {
      intermediateTiles.push(view.tileIndex);
    }
  }

  // Final-syllable case: row-end sentinel locks the trailing tiles when
  // `firstBoundary` is the last correct boundary.
  if (
    buildingIntermediate &&
    firstBoundary !== ROW_START &&
    correctBoundaries.length > 0 &&
    firstBoundary === correctBoundaries[correctBoundaries.length - 1] &&
    intermediateTiles.length !== totalTiles
  ) {
    for (const t of intermediateTiles) lockedTiles.add(t);
    lockedBoundaries.add(firstBoundary);
  }

  return { lockedTiles, lockedBoundaries };
}
