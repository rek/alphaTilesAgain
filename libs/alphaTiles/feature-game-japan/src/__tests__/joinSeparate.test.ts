import { joinTiles } from '../joinTiles';
import { separateTiles } from '../separateTiles';
import type { TileGroup } from '../evaluateGroupings';

function g(tiles: string[], isLocked = false): TileGroup {
  return { tiles, isLocked };
}

describe('joinTiles', () => {
  it('merges two adjacent groups into one', () => {
    const groups = [g(['ba']), g(['na']), g(['na'])];
    const result = joinTiles(groups, 1);
    expect(result).toHaveLength(2);
    expect(result[0].tiles).toEqual(['ba']);
    expect(result[1].tiles).toEqual(['na', 'na']);
  });

  it('merges first two groups', () => {
    const groups = [g(['ba']), g(['na']), g(['na'])];
    const result = joinTiles(groups, 0);
    expect(result).toHaveLength(2);
    expect(result[0].tiles).toEqual(['ba', 'na']);
    expect(result[1].tiles).toEqual(['na']);
  });

  it('returns unchanged array for out-of-range boundary', () => {
    const groups = [g(['ba']), g(['na'])];
    expect(joinTiles(groups, 5)).toEqual(groups);
    expect(joinTiles(groups, -1)).toEqual(groups);
  });

  it('does not join locked left group', () => {
    const groups = [g(['ba'], true), g(['na'])];
    expect(joinTiles(groups, 0)).toEqual(groups);
  });

  it('does not join locked right group', () => {
    const groups = [g(['ba']), g(['na'], true)];
    expect(joinTiles(groups, 0)).toEqual(groups);
  });

  it('new merged group is not locked', () => {
    const groups = [g(['ba']), g(['na'])];
    const result = joinTiles(groups, 0);
    expect(result[0].isLocked).toBe(false);
  });
});

describe('separateTiles', () => {
  it('splits a multi-tile group into individual groups', () => {
    const groups = [g(['ba', 'na', 'na'])];
    const result = separateTiles(groups, 0);
    expect(result).toHaveLength(3);
    expect(result[0].tiles).toEqual(['ba']);
    expect(result[1].tiles).toEqual(['na']);
    expect(result[2].tiles).toEqual(['na']);
  });

  it('splits a joined group in the middle of the row', () => {
    const groups = [g(['ba']), g(['na', 'na']), g(['ta'])];
    const result = separateTiles(groups, 1);
    expect(result).toHaveLength(4);
    expect(result[0].tiles).toEqual(['ba']);
    expect(result[1].tiles).toEqual(['na']);
    expect(result[2].tiles).toEqual(['na']);
    expect(result[3].tiles).toEqual(['ta']);
  });

  it('does not split a single-tile group', () => {
    const groups = [g(['ba']), g(['na'])];
    expect(separateTiles(groups, 0)).toEqual(groups);
  });

  it('does not split a locked group', () => {
    const groups = [g(['ba', 'na'], true)];
    expect(separateTiles(groups, 0)).toEqual(groups);
  });

  it('returns unchanged for out-of-range index', () => {
    const groups = [g(['ba']), g(['na'])];
    expect(separateTiles(groups, 5)).toEqual(groups);
    expect(separateTiles(groups, -1)).toEqual(groups);
  });

  it('split groups are not locked', () => {
    const groups = [g(['ba', 'na'])];
    const result = separateTiles(groups, 0);
    result.forEach((r) => expect(r.isLocked).toBe(false));
  });
});
