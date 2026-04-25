import { DIRECTIONS, MAX_DIRECTIONS_BY_CL } from './directions';
import type { ChallengeLevel } from './directions';

export const ROWS = 7;
export const COLS = 7;
export const CELLS = ROWS * COLS;
export const WORDS_PER_BOARD = 7;
export const MIN_TILES = 3;
export const MAX_TILES = 7;
export const PLACEMENT_ATTEMPTS_PER_WORD = 100;

export type PlacedWord<W> = {
  word: W;
  tiles: string[];
  // Cell indices in row-major order (col * ROWS + row to match Java tilesBoard[x][y]).
  // We store as plain row-major (row * COLS + col) for the JS port.
  path: number[];
};

// Boundary check mirrors Java Myanmar.java: branches on keypad code, NOT dx/dy.
// This preserves the idx-4 quirk where code 9 triggers north-bound checks even
// though its dy=0 (it never actually moves vertically).
function violatesBounds({
  keypadCode,
  startX,
  startY,
  wordLength,
}: {
  keypadCode: number;
  startX: number;
  startY: number;
  wordLength: number;
}): boolean {
  // y+wordLength>7 (south-going)
  if ([1, 2, 3].includes(keypadCode) && startY + wordLength > 7) return true;
  // x+wordLength>7 (east-going)
  if ([3, 6, 9].includes(keypadCode) && startX + wordLength > 7) return true;
  // y-wordLength<-1 (north-going)
  if ([7, 8, 9].includes(keypadCode) && startY - wordLength < -1) return true;
  // x-wordLength<-1 (west-going)
  if ([1, 4, 7].includes(keypadCode) && startX - wordLength < -1) return true;
  return false;
}

function rowMajor({ x, y }: { x: number; y: number }): number {
  return y * COLS + x;
}

// Attempts to place a single word's tiles on the grid. Mutates `grid` on success.
// Returns the cell-index path or null on failure.
function tryPlaceOne({
  grid,
  tiles,
  level,
  rng,
}: {
  grid: (string | null)[];
  tiles: string[];
  level: ChallengeLevel;
  rng: () => number;
}): number[] | null {
  const max = MAX_DIRECTIONS_BY_CL[level];
  const wordLength = tiles.length;

  for (let loops = 0; loops < PLACEMENT_ATTEMPTS_PER_WORD; loops++) {
    const startX = Math.floor(rng() * 7);
    const startY = Math.floor(rng() * 7);
    const wordD = Math.floor(rng() * (max + 1));
    const [keypadCode, dx, dy] = DIRECTIONS[wordD];

    if (violatesBounds({ keypadCode, startX, startY, wordLength })) continue;

    let conflict = false;
    const path: number[] = [];
    for (let t = 0; t < wordLength; t++) {
      const tx = startX + t * dx;
      const ty = startY + t * dy;
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) {
        conflict = true;
        break;
      }
      const idx = rowMajor({ x: tx, y: ty });
      if (grid[idx] !== null) {
        conflict = true;
        break;
      }
      path.push(idx);
    }
    if (conflict) continue;

    for (let t = 0; t < wordLength; t++) grid[path[t]] = tiles[t];
    return path;
  }
  return null;
}

// Place up to 7 words on a 7×7 grid using the challenge-level direction tier.
// Words are tried in array order. Skipped if length not in [3,7] OR if 100 attempts fail.
// Returns the populated grid (with nulls in unused cells; caller fills them) and placed metadata.
export function placeWords<W>({
  candidates,
  level,
  rng,
}: {
  candidates: ReadonlyArray<{ word: W; tiles: string[] }>;
  level: ChallengeLevel;
  rng: () => number;
}): { grid: (string | null)[]; placed: PlacedWord<W>[] } {
  const grid: (string | null)[] = new Array(CELLS).fill(null);
  const placed: PlacedWord<W>[] = [];

  for (const candidate of candidates) {
    if (placed.length === WORDS_PER_BOARD) break;
    const tiles = candidate.tiles;
    if (tiles.length < MIN_TILES || tiles.length > MAX_TILES) continue;
    const path = tryPlaceOne({ grid, tiles, level, rng });
    if (path !== null) {
      placed.push({ word: candidate.word, tiles: [...tiles], path });
    }
  }

  return { grid, placed };
}
