import { setupRound } from '../setupRound';

function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

describe('setupRound', () => {
  const source = Array.from({ length: 100 }, (_, i) => `w${i}`);

  it('returns insufficient-content when source < deckSize', () => {
    const small = source.slice(0, 10);
    expect(setupRound(small, 16, 16)).toEqual({ error: 'insufficient-content' });
  });

  it('builds board of boardSize and deck of deckSize when source is large enough', () => {
    const result = setupRound(source, 54, 16, seededRng(42));
    if ('error' in result) throw new Error('unexpected error');
    expect(result.board).toHaveLength(16);
    expect(result.deck).toHaveLength(54);
  });

  it('board entries are all members of the deck (deck is a re-shuffle of the same slice)', () => {
    const result = setupRound(source, 54, 16, seededRng(7));
    if ('error' in result) throw new Error('unexpected error');
    for (const card of result.board) expect(result.deck).toContain(card);
  });

  it('different seeds produce different board orderings (no degenerate determinism)', () => {
    const a = setupRound(source, 54, 16, seededRng(1));
    const b = setupRound(source, 54, 16, seededRng(999));
    if ('error' in a || 'error' in b) throw new Error('unexpected error');
    expect(a.board).not.toEqual(b.board);
  });

  it('handles deckSize === source.length boundary', () => {
    const result = setupRound(source, source.length, 16, seededRng(5));
    if ('error' in result) throw new Error('unexpected error');
    expect(result.deck).toHaveLength(source.length);
  });

  it('deck retains every distinct entry from the slice (round-trip via Set)', () => {
    const result = setupRound(source, 30, 16, seededRng(11));
    if ('error' in result) throw new Error('unexpected error');
    expect(new Set(result.deck).size).toBe(30);
  });
});
