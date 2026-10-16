import { parseFontScale } from './parseFontScale';

describe('parseFontScale', () => {
  it.each([
    ['absent', undefined, 1],
    ['blank', '  ', 1],
    ['1.3', '1.3', 1.3],
    ['padded', ' 1.2 ', 1.2],
    ['non-numeric', 'banana', 1],
    ['"large"', 'large', 1],
    ['Infinity', 'Infinity', 1],
    ['above max clamps to 2.5', '10', 2.5],
    ['below min clamps to 0.5', '0.1', 0.5],
    ['negative clamps to 0.5', '-2', 0.5],
  ])('%s', (_name, raw, expected) => {
    expect(parseFontScale(raw)).toBe(expected);
  });
});
