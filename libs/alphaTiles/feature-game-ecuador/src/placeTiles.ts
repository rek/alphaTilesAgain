/**
 * Non-overlapping random tile placement (port of Ecuador.java setBoxes ~129–276).
 *
 * Constants from Java lines 152–169:
 *   minY1 = usableHeight * 0.22
 *   maxY2 = usableHeight * 0.85
 *   maxStartX = usableWidth * 0.65
 *   minWidth = usableWidth * 0.25
 *   maxWidth = usableWidth * 0.50
 *   bufferX = usableWidth * 0.05
 *   bufferY = usableHeight * 0.05
 *   hwRatio = 4   (height = boxWidth / 4)
 *   maxStartY = usableHeight * 0.75
 *
 * Per-tile retry budget: 10 000. On budget exhaustion the algorithm restarts
 * the entire layout (Java currentBoxIndex = 0; extraLoops = 0). Java has no
 * outer cap; we cap at 5 outer restarts and return null on cap exhaustion so
 * the container can fall back to the insufficient-content state.
 */

export type ScatterPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const COUNT = 8;
const PER_TILE_RETRY_BUDGET = 10000;
const OUTER_RESTART_CAP = 5;
const HW_RATIO = 4;

function randInRange(min: number, max: number, rng: () => number): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

function overlaps(
  a: ScatterPlacement,
  b: ScatterPlacement,
  bufferX: number,
  bufferY: number,
): boolean {
  // Java parity: candidate vs. placed using buffered comparison (lines ~193–230).
  const ax2 = a.x + a.width;
  const ay2 = a.y + a.height;
  const bx2 = b.x + b.width;
  const by2 = b.y + b.height;
  const xOverlap = ax2 + bufferX >= b.x && a.x - bufferX <= bx2;
  const yOverlap = ay2 + bufferY >= b.y && a.y - bufferY <= by2;
  return xOverlap && yOverlap;
}

export function placeTiles(opts: {
  area: { width: number; height: number };
  rng?: () => number;
}): ScatterPlacement[] | null {
  const rng = opts.rng ?? Math.random;
  const { width: usableWidth, height: usableHeight } = opts.area;

  if (usableWidth <= 0 || usableHeight <= 0) return null;

  const minStartX = 0;
  const maxStartX = Math.floor(usableWidth * 0.65);
  const minStartY = Math.floor(usableHeight * 0.22);
  const maxStartY = Math.floor(usableHeight * 0.75);
  const minWidth = Math.floor(usableWidth * 0.25);
  const maxWidth = Math.floor(usableWidth * 0.5);
  const maxX2 = usableWidth;
  const maxY2 = Math.floor(usableHeight * 0.85);
  const bufferX = Math.floor(usableWidth * 0.05);
  const bufferY = Math.floor(usableHeight * 0.05);

  for (let outer = 0; outer < OUTER_RESTART_CAP; outer++) {
    const placed: ScatterPlacement[] = [];
    let extraLoops = 0;
    let outerFailed = false;

    while (placed.length < COUNT) {
      const x = randInRange(minStartX, maxStartX, rng);
      const y = randInRange(minStartY, maxStartY, rng);
      const width = randInRange(minWidth, maxWidth, rng);
      const height = Math.floor(width / HW_RATIO);
      const candidate: ScatterPlacement = { x, y, width, height };

      const x2 = x + width;
      const y2 = y + height;
      let ok = x2 <= maxX2 && y2 <= maxY2;
      if (ok) {
        for (const p of placed) {
          if (overlaps(candidate, p, bufferX, bufferY)) {
            ok = false;
            break;
          }
        }
      }

      if (ok) {
        placed.push(candidate);
      } else {
        extraLoops++;
        if (extraLoops >= PER_TILE_RETRY_BUDGET) {
          outerFailed = true;
          break;
        }
      }
    }

    if (!outerFailed) return placed;
  }

  return null;
}
