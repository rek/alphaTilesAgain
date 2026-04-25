import { COLS } from './placeWords';

export const STACK_LIMIT = 8;

export type StackState = {
  stack: number[];
  // Normalized direction (dx, dy) ∈ {-1, 0, 1}², set after the 2nd tap.
  direction: readonly [number, number] | null;
};

export const EMPTY_STACK: StackState = { stack: [], direction: null };

function cellXY(idx: number): { x: number; y: number } {
  return { x: idx % COLS, y: Math.floor(idx / COLS) };
}

function sign(n: number): number {
  return n === 0 ? 0 : n > 0 ? 1 : -1;
}

// Pure reducer for Method-2 (stack) selection. Mirrors Java respondToTileSelection2:
// 1st tap: free.
// 2nd tap: must be 8-neighbour-adjacent to 1st; establishes direction.
// 3rd+ tap: must be adjacent to last AND in same direction as established.
// Re-tapping the most-recent cell pops it (un-select).
// Invalid taps are ignored — stack and direction unchanged.
export function stackAppend({
  state,
  tap,
}: {
  state: StackState;
  tap: number;
}): StackState {
  const { stack, direction } = state;
  const last = stack[stack.length - 1];

  // Pop on re-tap of last.
  if (stack.length > 0 && tap === last) {
    const popped = stack.slice(0, -1);
    return {
      stack: popped,
      // Direction collapses once we drop below 2 cells.
      direction: popped.length >= 2 ? direction : null,
    };
  }

  // Cap reached — ignore further appends.
  if (stack.length >= STACK_LIMIT) return state;

  if (stack.length === 0) {
    return { stack: [tap], direction: null };
  }

  const lastXY = cellXY(last);
  const tapXY = cellXY(tap);
  const dx = tapXY.x - lastXY.x;
  const dy = tapXY.y - lastXY.y;
  const adjacent = Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0);
  if (!adjacent) return state;

  if (stack.length === 1) {
    // Establish direction from 1st→2nd.
    return { stack: [...stack, tap], direction: [sign(dx), sign(dy)] };
  }

  // 3rd+: must continue established direction.
  if (direction === null) return state;
  if (sign(dx) !== direction[0] || sign(dy) !== direction[1]) return state;

  return { stack: [...stack, tap], direction };
}
