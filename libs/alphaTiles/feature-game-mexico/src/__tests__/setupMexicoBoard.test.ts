import { setupMexicoBoard } from '../setupMexicoBoard';
import type { CardState } from '../setupMexicoBoard';

function makeWord(id: string) {
  return { wordInLWC: id, wordInLOP: id };
}

const WORDS = ['apple', 'bird', 'cat', 'dog', 'egg', 'fish', 'goat', 'hat', 'ink', 'jar'].map(makeWord);

describe('setupMexicoBoard', () => {
  it('returns correct number of cards (2 × pairCount)', () => {
    const result = setupMexicoBoard(WORDS, 3);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.cards).toHaveLength(6);
  });

  it('each word appears exactly once as TEXT and once as IMAGE', () => {
    const result = setupMexicoBoard(WORDS, 4);
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const byWord = new Map<string, CardState[]>();
    for (const card of result.cards) {
      const key = card.word.wordInLWC;
      if (!byWord.has(key)) byWord.set(key, []);
      const bucket = byWord.get(key);
      if (bucket) bucket.push(card);
    }

    expect(byWord.size).toBe(4);
    for (const cards of byWord.values()) {
      expect(cards).toHaveLength(2);
      const modes = cards.map((c) => c.mode).sort();
      expect(modes).toEqual(['IMAGE', 'TEXT']);
    }
  });

  it('all cards start HIDDEN', () => {
    const result = setupMexicoBoard(WORDS, 3);
    if ('error' in result) return;
    expect(result.cards.every((c) => c.status === 'HIDDEN')).toBe(true);
  });

  it('returns insufficient-content when pool is too small', () => {
    const result = setupMexicoBoard(WORDS.slice(0, 2), 3);
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toBe('insufficient-content');
  });

  it('works with exactly pairCount words', () => {
    const result = setupMexicoBoard(WORDS.slice(0, 5), 5);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.cards).toHaveLength(10);
  });

  it('does not mutate the input array', () => {
    const input = [...WORDS];
    const original = [...WORDS];
    setupMexicoBoard(input, 3);
    expect(input).toEqual(original);
  });

  it('produces deterministic output with a seeded rng', () => {
    const seededRng = (() => {
      let calls = 0;
      return () => (calls++ * 0.137) % 1;
    })();
    const result1 = setupMexicoBoard(WORDS, 3, seededRng);

    const seededRng2 = (() => {
      let calls = 0;
      return () => (calls++ * 0.137) % 1;
    })();
    const result2 = setupMexicoBoard(WORDS, 3, seededRng2);

    expect(result1).toEqual(result2);
  });

  it('all 5 challenge levels produce correct card counts', () => {
    const pairCounts = [3, 4, 6, 8, 10];
    for (const pairCount of pairCounts) {
      const result = setupMexicoBoard(WORDS, pairCount);
      if ('error' in result) {
        // expected for pairCount > WORDS.length (10); levels 4/5 need ≥8/10 words
        expect(WORDS.length).toBeLessThan(pairCount);
      } else {
        expect(result.cards).toHaveLength(pairCount * 2);
      }
    }
  });

  it('dedupes when pool has duplicate wordInLWC entries (Java sanity-counter)', () => {
    // Pool length passes the size check but only 3 distinct LWC values exist.
    const dupPool = [
      makeWord('apple'),
      makeWord('apple'),
      makeWord('bird'),
      makeWord('bird'),
      makeWord('cat'),
      makeWord('cat'),
    ];
    const result = setupMexicoBoard(dupPool, 3);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    const distinct = new Set(result.cards.map((c) => c.word.wordInLWC));
    expect(distinct.size).toBe(3);
  });

  it('bails to insufficient-content when pool lacks enough distinct LWC entries', () => {
    // 5-entry pool but only 1 distinct LWC; sanity counter (pairCount*3) bails.
    const dupPool = [
      makeWord('apple'),
      makeWord('apple'),
      makeWord('apple'),
      makeWord('apple'),
      makeWord('apple'),
    ];
    const result = setupMexicoBoard(dupPool, 3);
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toBe('insufficient-content');
  });
});
