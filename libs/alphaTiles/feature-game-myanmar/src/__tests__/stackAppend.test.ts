import { stackAppend, EMPTY_STACK, STACK_LIMIT } from '../stackAppend';
import type { StackState } from '../stackAppend';

// 7×7 grid: idx = y*7 + x
function idx(x: number, y: number): number {
  return y * 7 + x;
}

function applyAll(taps: number[]) {
  let s = EMPTY_STACK;
  for (const t of taps) s = stackAppend({ state: s, tap: t });
  return s;
}

describe('stackAppend', () => {
  it('1st tap is unconstrained', () => {
    const s = stackAppend({ state: EMPTY_STACK, tap: idx(3, 3) });
    expect(s.stack).toEqual([idx(3, 3)]);
    expect(s.direction).toBeNull();
  });

  it('2nd tap must be 8-neighbour-adjacent — establishes direction', () => {
    const s = applyAll([idx(0, 0), idx(1, 1)]);
    expect(s.stack).toEqual([idx(0, 0), idx(1, 1)]);
    expect(s.direction).toEqual([1, 1]);
  });

  it('non-adjacent 2nd tap is ignored (stack and direction unchanged)', () => {
    const s = applyAll([idx(0, 0), idx(3, 3)]);
    expect(s.stack).toEqual([idx(0, 0)]);
    expect(s.direction).toBeNull();
  });

  it('3rd tap must continue established direction', () => {
    const s = applyAll([idx(0, 0), idx(1, 0), idx(2, 0)]);
    expect(s.stack).toEqual([idx(0, 0), idx(1, 0), idx(2, 0)]);
    expect(s.direction).toEqual([1, 0]);
  });

  it('3rd tap that breaks direction is ignored', () => {
    // dir established as right (1,0); attempting (1,1) (down-right) is rejected
    const s = applyAll([idx(0, 0), idx(1, 0), idx(2, 1)]);
    expect(s.stack).toEqual([idx(0, 0), idx(1, 0)]);
    expect(s.direction).toEqual([1, 0]);
  });

  it('re-tapping the most-recent cell pops it', () => {
    const s = applyAll([idx(0, 0), idx(1, 1), idx(2, 2), idx(2, 2)]);
    expect(s.stack).toEqual([idx(0, 0), idx(1, 1)]);
    expect(s.direction).toEqual([1, 1]); // direction kept while stack >= 2
  });

  it('popping below 2 cells clears direction', () => {
    const s = applyAll([idx(0, 0), idx(1, 1), idx(1, 1)]);
    expect(s.stack).toEqual([idx(0, 0)]);
    expect(s.direction).toBeNull();
  });

  it('cap at STACK_LIMIT (8) — further appends ignored', () => {
    // Build a stack of 8 cells directly. STACK_LIMIT only matters in the
    // theoretical case (max word length is 7 in placeWords); a synthetic state
    // verifies the guard.
    const fullStack: StackState = {
      stack: [0, 1, 2, 3, 4, 5, 6, 7],
      direction: [1, 0],
    };
    expect(fullStack.stack.length).toBe(STACK_LIMIT);
    // 9th tap (continuing direction (1,0) from idx 7 = (0,1) → idx 8 = (1,1) is NOT continuing, so use (8 mod 7=1, 1)).
    // Easier: just confirm append returns unchanged state when at cap.
    const next = stackAppend({ state: fullStack, tap: 8 });
    expect(next).toBe(fullStack);
  });
});
