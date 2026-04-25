import { evaluateGroupings } from '../evaluateGroupings';
import type { TileGroup } from '../evaluateGroupings';

function g(tiles: string[], isLocked = false): TileGroup {
  return { tiles, isLocked };
}

describe('evaluateGroupings', () => {
  const correctSyllables = [['ba'], ['na', 'na']];

  it('returns empty set when no groups match', () => {
    const groups = [g(['na']), g(['ba', 'na'])];
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set());
  });

  it('returns partial match (first syllable correct, second wrong)', () => {
    const groups = [g(['ba']), g(['na']), g(['na'])];
    // correctSyllables[0] = ['ba'] → matches
    // correctSyllables[1] = ['na','na'] but groups[1] = ['na'] → mismatch
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set([0]));
  });

  it('returns full match when all groups match syllables', () => {
    const groups = [g(['ba']), g(['na', 'na'])];
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set([0, 1]));
  });

  it('no match when groups count does not align', () => {
    const groups = [g(['ba', 'na', 'na'])];
    // Single group covering whole word: correctSyllables[0] = ['ba'] ≠ 'banana'
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set());
  });

  it('breaks chain on first mismatch (does not award later correct groups)', () => {
    // correctSyllables: [['ba'], ['na','na']]
    // groups: wrong first, then correct second
    const groups = [g(['na']), g(['ba', 'na'])];
    // groups[0].tiles.join = 'na' ≠ 'ba' → chain breaks; group[1] not evaluated
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set());
  });

  it('handles already-locked groups in input (locked flag ignored in evaluation)', () => {
    const groups = [g(['ba'], true), g(['na', 'na'])];
    expect(evaluateGroupings(groups, correctSyllables)).toEqual(new Set([0, 1]));
  });
});
