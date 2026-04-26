import { countForLevel } from '../countForLevel';

describe('countForLevel', () => {
  it.each([
    [1, 6],
    [2, 12],
    [3, 18],
    [4, 6],
    [5, 12],
    [6, 18],
    [7, 6],
    [8, 12],
    [9, 18],
    [10, 6],
    [11, 12],
    [12, 18],
  ] as const)('CL%d → %d choices', (level, expected) => {
    expect(countForLevel(level)).toBe(expected);
  });
});
