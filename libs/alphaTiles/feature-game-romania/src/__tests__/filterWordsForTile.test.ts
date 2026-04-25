import { filterWordsForTile } from '../filterWordsForTile';

type Word = { wordInLOP: string; wordInLWC: string; mixedDefs: string };

function w(id: string): Word {
  return { wordInLWC: id, wordInLOP: id, mixedDefs: '' };
}

// apple → [a, p, p, l, e]; banana → [b, a, n, a, n, a]; cat → [c, a, t]; bat → [b, a, t]
const WORD_TILES: Record<string, string[]> = {
  apple:  ['a', 'p', 'p', 'l', 'e'],
  banana: ['b', 'a', 'n', 'a', 'n', 'a'],
  cat:    ['c', 'a', 't'],
  bat:    ['b', 'a', 't'],
};

function parseWord(word: Word): string[] {
  return WORD_TILES[word.wordInLWC] ?? [];
}

const WORDS_FOR_A: readonly Word[] = [
  w('apple'),  // 'a' is initial
  w('banana'), // 'a' is non-initial
  w('cat'),    // 'a' is non-initial
  w('bat'),    // 'a' is non-initial
];

describe('filterWordsForTile', () => {
  describe('scanSetting 1 (initial only)', () => {
    it('returns only words where focus tile is first', () => {
      const result = filterWordsForTile(WORDS_FOR_A, 1, 'a', parseWord);
      expect(result.map((w) => w.wordInLWC)).toEqual(['apple']);
    });

    it('returns empty when no word starts with the focus tile', () => {
      const words = [w('banana'), w('cat')];
      const result = filterWordsForTile(words, 1, 'a', parseWord);
      expect(result).toEqual([]);
    });
  });

  describe('scanSetting 2 (initial preferred)', () => {
    it('puts initial words first, then non-initial', () => {
      const result = filterWordsForTile(WORDS_FOR_A, 2, 'a', parseWord);
      expect(result[0].wordInLWC).toBe('apple');
      const rest = result.slice(1).map((w) => w.wordInLWC);
      expect(rest).toContain('banana');
      expect(rest).toContain('cat');
      expect(rest).toContain('bat');
    });

    it('returns all words when all are non-initial', () => {
      const words = [w('banana'), w('cat'), w('bat')];
      const result = filterWordsForTile(words, 2, 'a', parseWord);
      expect(result.map((w) => w.wordInLWC)).toEqual(['banana', 'cat', 'bat']);
    });
  });

  describe('scanSetting 3 (all positions)', () => {
    it('returns all words unchanged', () => {
      const result = filterWordsForTile(WORDS_FOR_A, 3, 'a', parseWord);
      expect(result.map((w) => w.wordInLWC)).toEqual(['apple', 'banana', 'cat', 'bat']);
    });

    it('returns empty when input is empty', () => {
      expect(filterWordsForTile([], 3, 'a', parseWord)).toEqual([]);
    });
  });
});
