import { checkRowSolved } from '../checkRowSolved';
import type { TileEntry } from '@shared/util-phoneme';

function makeTile(base: string): TileEntry {
  return {
    base,
    alt1: '', alt2: '', alt3: '',
    type: 'C',
    audioName: '',
    tileTypeB: 'none',
    audioNameB: '',
    tileTypeC: 'none',
    audioNameC: '',
    stageOfFirstAppearance: 1,
    stageOfFirstAppearanceType2: 1,
    stageOfFirstAppearanceType3: 1,
  };
}

function makeWord(wordInLOP: string) {
  return { wordInLOP, mixedDefs: '', stageOfFirstAppearance: '1' };
}

// Tiles: c, a, t, f, i, s, h
const tileRows: TileEntry[] = ['c', 'a', 't', 'f', 'i', 's', 'h'].map(makeTile);
const tileMap = new Map(tileRows.map((t) => [t.base, t]));

// Board: rows 0,1,2 = four-tile words; row 3 = three-tile word
// |f|i|s|h|  row 0 (indices 0-3)
// |c|a|t| |  row 1 (indices 4-7) — blank at 7
// | |f|i|s|  row 2 (indices 8-11) — blank at 8
// |c|a|t| |  row 3 (indices 12-15) — blank at 15
function makeBoard(): string[] {
  return [
    'f','i','s','h',   // row 0: "fish"
    'c','a','t','',    // row 1: "cat" + blank at 7
    '','f','i','s',    // row 2: blank at 8 + partial
    'c','a','t','',    // row 3: "cat" + blank at 15
  ];
}

describe('checkRowSolved', () => {
  describe('row 0 (four-tile word "fish")', () => {
    it('returns true when row matches targetWord', () => {
      const board = makeBoard();
      expect(
        checkRowSolved({
          board, row: 0, targetWord: makeWord('fish'),
          blankIndex: 7, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(true);
    });

    it('returns false when tiles do not match', () => {
      const board = makeBoard();
      board[0] = 'c'; // row 0 now starts with 'c'
      expect(
        checkRowSolved({
          board, row: 0, targetWord: makeWord('fish'),
          blankIndex: 7, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(false);
    });
  });

  describe('row 3 blank-position constraint (three-tile word)', () => {
    it('returns true when blank is at index 15 (column 3) — |c|a|t| |', () => {
      const board = makeBoard(); // blank at 15
      expect(
        checkRowSolved({
          board, row: 3, targetWord: makeWord('cat'),
          blankIndex: 15, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(true);
    });

    it('returns true when blank is at index 12 (column 0) — | |c|a|t|', () => {
      const board = makeBoard();
      // Rearrange row 3: blank at 12, cat at 13,14,15
      board[12] = ''; board[13] = 'c'; board[14] = 'a'; board[15] = 't';
      expect(
        checkRowSolved({
          board, row: 3, targetWord: makeWord('cat'),
          blankIndex: 12, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(true);
    });

    it('returns false when blank is at index 13 (column 1) — |c| |a|t|', () => {
      const board = makeBoard();
      board[12] = 'c'; board[13] = ''; board[14] = 'a'; board[15] = 't';
      expect(
        checkRowSolved({
          board, row: 3, targetWord: makeWord('cat'),
          blankIndex: 13, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(false);
    });

    it('returns false when blank is at index 14 (column 2) — |c|a| |t|', () => {
      const board = makeBoard();
      board[12] = 'c'; board[13] = 'a'; board[14] = ''; board[15] = 't';
      expect(
        checkRowSolved({
          board, row: 3, targetWord: makeWord('cat'),
          blankIndex: 14, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
        }),
      ).toBe(false);
    });
  });

  it('blank outside row 3 does not trigger the constraint', () => {
    const board = makeBoard(); // blank at 15
    // Check row 1 with blank at 7 (row 1, col 3)
    board[4] = 'c'; board[5] = 'a'; board[6] = 't'; board[7] = '';
    expect(
      checkRowSolved({
        board, row: 1, targetWord: makeWord('cat'),
        blankIndex: 7, tileMap, placeholderCharacter: '◌', scriptType: 'Roman',
      }),
    ).toBe(true); // "cat" + blank in last cell = valid 3-tile row 1 (four-tile target — need 4 tiles)
    // Actually "cat" is only 3 tiles; four-tile row won't match "cat" unless target is also "cat"
    // Row 1 target here is makeWord('cat') but with blank at col 3, combineTiles gives 'cat'
    // standardizeWordSequence('cat') = 'cat' → should match
  });
});
