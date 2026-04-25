import { updateKeyboard } from '../updateKeyboard';
import type { ColorTile } from '../evaluateGuess';

function key(text: string, color: ColorTile['color']): ColorTile {
  return { text, color };
}

describe('updateKeyboard', () => {
  it('advances KEY → GRAY', () => {
    const keys = [key('a', 'KEY'), key('b', 'KEY')];
    const guess = [key('a', 'GRAY'), key('b', 'GREEN')];
    const result = updateKeyboard(keys, guess);
    expect(result[0].color).toBe('GRAY');
    expect(result[1].color).toBe('GREEN');
  });

  it('advances BLUE → GREEN', () => {
    const keys = [key('a', 'BLUE')];
    const guess = [key('a', 'GREEN')];
    const result = updateKeyboard(keys, guess);
    expect(result[0].color).toBe('GREEN');
  });

  it('never regresses GREEN → BLUE', () => {
    const keys = [key('a', 'GREEN')];
    const guess = [key('a', 'BLUE')];
    const result = updateKeyboard(keys, guess);
    expect(result[0].color).toBe('GREEN');
  });

  it('never regresses GREEN → GRAY', () => {
    const keys = [key('a', 'GREEN')];
    const guess = [key('a', 'GRAY')];
    const result = updateKeyboard(keys, guess);
    expect(result[0].color).toBe('GREEN');
  });

  it('never regresses BLUE → GRAY', () => {
    const keys = [key('a', 'BLUE')];
    const guess = [key('a', 'GRAY')];
    const result = updateKeyboard(keys, guess);
    expect(result[0].color).toBe('BLUE');
  });

  it('leaves unmatched keys unchanged', () => {
    const keys = [key('a', 'KEY'), key('z', 'KEY')];
    const guess = [key('a', 'GREEN')];
    const result = updateKeyboard(keys, guess);
    expect(result[1].color).toBe('KEY'); // 'z' not in guess → unchanged
  });

  it('returns new array (immutable)', () => {
    const keys = [key('a', 'KEY')];
    const guess = [key('a', 'GRAY')];
    const result = updateKeyboard(keys, guess);
    expect(result).not.toBe(keys);
    expect(result[0]).not.toBe(keys[0]); // new object for updated tile
  });

  it('handles empty guess result', () => {
    const keys = [key('a', 'KEY')];
    const result = updateKeyboard(keys, []);
    expect(result[0].color).toBe('KEY');
  });
});
