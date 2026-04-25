// Mirror of Java Myanmar.java `directions[]` array.
// Each entry: [keypadCode, dx, dy] where dx is column-delta and dy is row-delta
// (dy>0 = down, dx<0 = left). Verbatim from upstream — including the idx-4 bug:
// keypad code 9 (up-right) carries dx=1,dy=0, duplicating idx-1's right movement.
// Boundary checks in Java still branch on the keypad code, so idx 4 is treated as
// "going east AND going north" even though dy=0. See spec.md R2.
export const DIRECTIONS: ReadonlyArray<readonly [number, number, number]> = [
  [2,  0,  1], // 0: down  (keypad 2)
  [6,  1,  0], // 1: right (keypad 6)
  [1, -1,  1], // 2: down-left (keypad 1)
  [3,  1,  1], // 3: down-right (keypad 3)
  [9,  1,  0], // 4: BUG — keypad 9 with dx=1,dy=0; effectively duplicate of idx-1 right
  [4, -1,  0], // 5: left (keypad 4)
  [7, -1, -1], // 6: up-left (keypad 7)
  [8,  0, -1], // 7: up (keypad 8)
] as const;

export const MAX_DIRECTIONS_BY_CL = { 1: 1, 2: 4, 3: 7 } as const;

export type ChallengeLevel = 1 | 2 | 3;
