import { evaluateGroupings } from '../evaluateGroupings';
import type { TileGroup } from '../evaluateGroupings';

function g(tiles: string[], isLocked = false): TileGroup {
  return { tiles, isLocked };
}

describe('evaluateGroupings (currentViews walk, partial credit)', () => {
  // Word "banana" -> tiles [ba, na, na] -> syllables [[ba], [na, na]]
  // Correct internal boundary indices (after-tile-index): [0]
  const correctSyllables = [['ba'], ['na', 'na']];

  it('credits first 1-tile syllable when its right bookend boundary is present', () => {
    // Initial state, all separate. currentViews = [tile0, link0, tile1, link1, tile2].
    // Walk: tile0 -> intermediate=[0]; link0 (correct, secondIdx=0, pairComplete via row-start)
    //       -> lock {0}; firstBoundary=0; tile1=na -> intermediate=[1]; link1 (NOT correct)
    //       -> break; tile2 not building. End walk: firstBoundary=0 IS last correct boundary
    //       but buildingIntermediate=false, so trailing tiles are not auto-locked.
    const groups = [g(['ba']), g(['na']), g(['na'])];
    const { lockedTiles, lockedBoundaries } = evaluateGroupings(groups, correctSyllables);
    expect(lockedTiles.has(0)).toBe(true);
    expect(lockedBoundaries.has(0)).toBe(true);
    // Trailing partial tiles are NOT locked because the link1 break occurred.
    expect(lockedTiles.has(1)).toBe(false);
    expect(lockedTiles.has(2)).toBe(false);
  });

  it('credits last syllable via row-end sentinel when joined into one group', () => {
    // groups = [[ba], [na,na]]. currentViews = [tile0, link0, tile1, tile2].
    // tile0->[0]; link0 correct -> lock {0}; firstBoundary=0; tile1->[1]; tile2->[1,2].
    // End: firstBoundary=0 == last correct boundary; intermediate=[1,2]; not all tiles
    // -> lock 1, 2; lock boundary 0 again.
    const groups = [g(['ba']), g(['na', 'na'])];
    const { lockedTiles } = evaluateGroupings(groups, correctSyllables);
    expect(lockedTiles.has(0)).toBe(true);
    expect(lockedTiles.has(1)).toBe(true);
    expect(lockedTiles.has(2)).toBe(true);
  });

  it('credits middle 1-tile syllable bracketed by two correct boundaries WITHOUT joining', () => {
    // syllables [[a],[b],[c]] -> correct boundaries after tile 0 and tile 1.
    // All separate; both bookend link buttons are present and the middle tile
    // sits between them with no intervening internal boundary, so chain holds.
    const cs = [['a'], ['b'], ['c']];
    const groups = [g(['a']), g(['b']), g(['c'])];
    const { lockedTiles, lockedBoundaries } = evaluateGroupings(groups, cs);
    expect(lockedTiles.has(1)).toBe(true);
    expect(lockedBoundaries.has(0)).toBe(true);
    expect(lockedBoundaries.has(1)).toBe(true);
  });

  it('does NOT credit a multi-tile middle syllable when its internal boundary is unjoined', () => {
    // syllables [[a],[b,c],[d]] -> correct boundaries after 0 and 2. With nothing
    // joined, boundary 1 (internal-to-middle-syllable) is present and breaks
    // the chain - Java behavior. User must join b+c to credit the middle.
    const cs = [['a'], ['b', 'c'], ['d']];
    const groups = [g(['a']), g(['b']), g(['c']), g(['d'])];
    const { lockedTiles } = evaluateGroupings(groups, cs);
    expect(lockedTiles.has(1)).toBe(false);
    expect(lockedTiles.has(2)).toBe(false);
  });

  it('credits multi-tile middle syllable once its internal boundary is joined', () => {
    // syllables [[a],[b,c],[d]]. User joined b+c. currentViews has
    // tile a, link0 (correct), b, c (joined - no link), link2 (correct), d.
    const cs = [['a'], ['b', 'c'], ['d']];
    const groups = [g(['a']), g(['b', 'c']), g(['d'])];
    const { lockedTiles, lockedBoundaries } = evaluateGroupings(groups, cs);
    expect(lockedTiles.has(1)).toBe(true);
    expect(lockedTiles.has(2)).toBe(true);
    expect(lockedBoundaries.has(0)).toBe(true);
    expect(lockedBoundaries.has(2)).toBe(true);
  });

  it('returns empty when single group spans all tiles (no link buttons present)', () => {
    // syllables [[a],[b]] -> correct boundary after index 0. User joined a+b.
    // currentViews = [tile0, tile1] (no link). No correct boundary visit.
    const cs = [['a'], ['b']];
    const groups = [g(['a', 'b'])];
    const { lockedTiles, lockedBoundaries } = evaluateGroupings(groups, cs);
    expect(lockedTiles.size).toBe(0);
    expect(lockedBoundaries.size).toBe(0);
  });

  it('single-syllable degenerate case has no internal correct boundary -> no locks', () => {
    const cs = [['x', 'y']];
    const groups = [g(['x']), g(['y'])];
    const { lockedTiles } = evaluateGroupings(groups, cs);
    expect(lockedTiles.size).toBe(0);
  });

it('breaks the chain when an incorrect link button precedes the only correct one', () => {
    // syllables [[a,b],[c,d]] -> correct boundary after index 1 only.
    // All separate: link0 (incorrect) breaks; link1 (correct) restarts;
    // link2 (incorrect) breaks again. End: building=false -> no lock.
    const cs = [['a', 'b'], ['c', 'd']];
    const groups = [g(['a']), g(['b']), g(['c']), g(['d'])];
    const { lockedTiles } = evaluateGroupings(groups, cs);
    expect(lockedTiles.size).toBe(0);
  });
});
