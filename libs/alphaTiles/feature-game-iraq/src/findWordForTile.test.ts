import { findWordForTile } from './findWordForTile';

function makeWord(wordInLOP: string) {
  return {
    wordInLWC: wordInLOP,
    wordInLOP,
    duration: 0,
    mixedDefs: '',
    stageOfFirstAppearance: '1',
  };
}

describe('findWordForTile', () => {
  // parseWord splits by char for tests
  const parseWord = (w: { wordInLOP: string }) => w.wordInLOP.split('');
  const fixedRng = () => 0;

  const words = [
    makeWord('cat'), // c, a, t
    makeWord('cab'), // c, a, b
    makeWord('act'), // a, c, t
    makeWord('bat'), // b, a, t
  ];

  describe('scan=1', () => {
    it('returns random word with tile at position 1 (index 0)', () => {
      const out = findWordForTile({
        tileBase: 'c',
        words,
        scanSetting: 1,
        parseWord,
        rng: fixedRng,
      });
      expect(out?.wordInLOP).toBe('cat');
    });

    it('returns null when no position-1 match (no fallback)', () => {
      // 't' is never at index 0
      const out = findWordForTile({
        tileBase: 't',
        words,
        scanSetting: 1,
        parseWord,
        rng: fixedRng,
      });
      expect(out).toBeNull();
    });
  });

  describe('scan=2', () => {
    it('returns position-1 match first', () => {
      const out = findWordForTile({
        tileBase: 'c',
        words,
        scanSetting: 2,
        parseWord,
        rng: fixedRng,
      });
      expect(out?.wordInLOP).toBe('cat');
    });

    it('falls back to position 2 when no position-1 match', () => {
      // Use words where the target tile is *only* at idx 1
      const out = findWordForTile({
        tileBase: 'a',
        words: [makeWord('cat'), makeWord('bat')], // 'a' at idx 1 only
        scanSetting: 2,
        parseWord,
        rng: fixedRng,
      });
      expect(out?.wordInLOP).toBe('cat');
    });

    it('returns null when no match at position 1 or 2', () => {
      const out = findWordForTile({
        tileBase: 'z',
        words,
        scanSetting: 2,
        parseWord,
        rng: fixedRng,
      });
      expect(out).toBeNull();
    });
  });

  describe('scan=3', () => {
    it('returns position-3 match (index 2) only', () => {
      const out = findWordForTile({
        tileBase: 't',
        words,
        scanSetting: 3,
        parseWord,
        rng: fixedRng,
      });
      // 't' at index 2 in 'cat', 'act', 'bat' → first picked with rng=0
      expect(out?.wordInLOP).toBe('cat');
    });

    it('returns null when tile not at position 3 (no fallback to 1)', () => {
      const out = findWordForTile({
        tileBase: 'c',
        words,
        scanSetting: 3,
        parseWord,
        rng: fixedRng,
      });
      // 'c' at idx 0 (cat,cab) and idx 1 (act). NOT at idx 2 → null.
      expect(out).toBeNull();
    });
  });
});
