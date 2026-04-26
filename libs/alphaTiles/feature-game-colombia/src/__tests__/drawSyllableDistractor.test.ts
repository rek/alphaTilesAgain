import { drawSyllableDistractor } from '../drawSyllableDistractor';
import { makeSyllable, makeTile, seededRng } from './fixtures';

describe('drawSyllableDistractor', () => {
  it('returns a non-target distractor when distractors are available', () => {
    const target = makeSyllable('ka', ['ke', 'ko', 'ki']);
    const pool = [target, makeSyllable('ke'), makeSyllable('ko'), makeSyllable('ki')];
    const r = drawSyllableDistractor({
      target, pool, sadStrings: new Set(),
      tilesByBase: new Map(), rng: seededRng(1),
    });
    expect(['ke', 'ko', 'ki']).toContain(r.syllable);
  });

  it('clones SAD-targets to avoid aliasing the parsed array', () => {
    const target = makeSyllable('a', ['e', 'o', 'i']);
    const tile = makeTile('a', 'SAD', ['e', 'o', 'i']);
    const tilesByBase = new Map([['a', tile]]);
    const r = drawSyllableDistractor({
      target,
      pool: [target],
      sadStrings: new Set(['a']),
      tilesByBase,
      rng: seededRng(1),
    });
    expect(r).not.toBe(target);
    expect(['e', 'o', 'i']).toContain(r.syllable);
    expect(target.syllable).toBe('a');
  });

  it('SAD distractor swap: keeps distractors size 3 by re-inserting original', () => {
    const target = makeSyllable('a', ['e', 'o', 'i']);
    const tile = makeTile('a', 'SAD', ['e', 'o', 'i']);
    const tilesByBase = new Map([['a', tile]]);
    const r = drawSyllableDistractor({
      target,
      pool: [target],
      sadStrings: new Set(['a']),
      tilesByBase,
      rng: () => 0,
    });
    expect(r.syllable).toBe('e');
    expect(r.distractors.includes('a')).toBe(true);
    expect(r.distractors.includes('e')).toBe(false);
  });
});
