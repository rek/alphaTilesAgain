import { COLS, ROWS } from './placeWords';

// Resolve a Method-1 (classic) two-tap selection into an ordered cell-index path.
// Returns null if first==second (zero-length span) or if the two cells don't lie
// on a straight 8-direction line (not horizontal, vertical, or 45° diagonal).
//
// Java reference: respondToTileSelection() builds the candidate path from the
// straight line between firstSelected and secondSelected. This pure helper
// reproduces that geometry without commenting on adjacency or grid contents.
export function spanBetween({
  first,
  second,
}: {
  first: number;
  second: number;
}): number[] | null {
  if (first === second) return null;

  const fx = first % COLS;
  const fy = Math.floor(first / COLS);
  const sx = second % COLS;
  const sy = Math.floor(second / COLS);

  const ddx = sx - fx;
  const ddy = sy - fy;

  // Must lie on a horizontal, vertical, or 45° diagonal axis.
  if (ddx !== 0 && ddy !== 0 && Math.abs(ddx) !== Math.abs(ddy)) return null;

  const steps = Math.max(Math.abs(ddx), Math.abs(ddy));
  const stepX = ddx === 0 ? 0 : ddx / Math.abs(ddx);
  const stepY = ddy === 0 ? 0 : ddy / Math.abs(ddy);

  const path: number[] = [];
  for (let t = 0; t <= steps; t++) {
    const x = fx + t * stepX;
    const y = fy + t * stepY;
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
    path.push(y * COLS + x);
  }
  return path;
}
