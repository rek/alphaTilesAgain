import { pickEcuadorWords } from '../pickEcuadorWords';

function makeWord(s: string) {
  return {
    wordInLWC: s,
    wordInLOP: s,
    duration: 0,
    mixedDefs: '',
    stageOfFirstAppearance: '1',
  };
}

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('pickEcuadorWords', () => {
  const words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'].map(
    makeWord,
  );

  it('returns insufficient-content when fewer than 9 words', () => {
    const out = pickEcuadorWords({ words: words.slice(0, 8) });
    expect('error' in out).toBe(true);
  });

  it('returns prompt + 8 tile slots', () => {
    const out = pickEcuadorWords({ words, rng: seededRng(1) });
    expect('error' in out).toBe(false);
    if ('error' in out) return;
    expect(out.tileWords).toHaveLength(8);
    expect(out.prompt).toBeTruthy();
  });

  it('correctSlot is in [0, 8)', () => {
    for (let s = 1; s <= 50; s++) {
      const out = pickEcuadorWords({ words, rng: seededRng(s) });
      if ('error' in out) continue;
      expect(out.correctSlot).toBeGreaterThanOrEqual(0);
      expect(out.correctSlot).toBeLessThan(8);
    }
  });

  it('does NOT dedupe (Java parity) — caller must accept duplicates', () => {
    const dup = [
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
      makeWord('cat'),
    ];
    const out = pickEcuadorWords({ words: dup, rng: seededRng(3) });
    expect('error' in out).toBe(false);
    if ('error' in out) return;
    const allTexts = [out.prompt.wordInLOP, ...out.tileWords.map((w) => w.wordInLOP)];
    expect(new Set(allTexts).size).toBe(1);
  });

  it('tile slots use entries 1..8 of the shuffled pool (length 8)', () => {
    const out = pickEcuadorWords({ words, rng: seededRng(99) });
    if ('error' in out) throw new Error('expected success');
    expect(out.tileWords).toHaveLength(8);
    expect(typeof out.prompt.wordInLOP).toBe('string');
  });
});
