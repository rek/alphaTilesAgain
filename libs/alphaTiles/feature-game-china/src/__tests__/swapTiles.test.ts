import { swapTiles } from '../swapTiles';

function makeBoard(): string[] {
  return ['a', 'b', 'c', 'd', 'e', '', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
  // blank at index 5
}

describe('swapTiles', () => {
  it('swaps two cells and returns new board (immutable)', () => {
    const board = makeBoard();
    const { board: next } = swapTiles(board, 0, 1);
    expect(next[0]).toBe('b');
    expect(next[1]).toBe('a');
    expect(board[0]).toBe('a'); // original unchanged
  });

  it('blankIndex tracks the blank cell after swap (blank moves to indexA)', () => {
    const board = makeBoard(); // blank at 5
    const { blankIndex } = swapTiles(board, 4, 5);
    expect(blankIndex).toBe(4); // blank moves to 4 (was e, now '')
  });

  it('blankIndex tracks the blank cell (blank stays at indexB after swap)', () => {
    const board = makeBoard(); // blank at 5
    const { board: next, blankIndex } = swapTiles(board, 5, 4);
    expect(next[5]).toBe('e');
    expect(next[4]).toBe('');
    expect(blankIndex).toBe(4);
  });

  it('blank moves from 5 to 6 correctly', () => {
    const board = makeBoard();
    const { board: next, blankIndex } = swapTiles(board, 6, 5);
    expect(next[5]).toBe('g');
    expect(next[6]).toBe('');
    expect(blankIndex).toBe(6);
  });
});
