import { buildWrongCL1 } from '../buildWrongCL1';
import { makeTile, makeParsed } from './testFixtures';

describe('buildWrongCL1', () => {
  const parsed = ['c', 'a', 't'].map((b, i) => makeParsed(b, i % 2 === 0 ? 'C' : 'V'));
  const trio = [makeTile('k'), makeTile('s'), makeTile('x')];
  const tileMap = new Map([
    ['c', makeTile('c', 'C', ['k', 's', 'x'])],
    ['a', makeTile('a', 'V')],
    ['t', makeTile('t', 'C')],
    ['k', makeTile('k')],
    ['s', makeTile('s')],
    ['x', makeTile('x')],
  ]);

  it('replaces only tile[0] with the slot-indexed trio entry', () => {
    expect(buildWrongCL1({
      parsed, tileMap, trioShuffled: trio,
      slotIndex: 0, wordInLOP: 'cat', scriptType: 'Roman',
    })).toBe('kat');
    expect(buildWrongCL1({
      parsed, tileMap, trioShuffled: trio,
      slotIndex: 1, wordInLOP: 'cat', scriptType: 'Roman',
    })).toBe('sat');
    expect(buildWrongCL1({
      parsed, tileMap, trioShuffled: trio,
      slotIndex: 2, wordInLOP: 'cat', scriptType: 'Roman',
    })).toBe('xat');
  });

  it('returns null on empty trio', () => {
    expect(buildWrongCL1({
      parsed, tileMap, trioShuffled: [],
      slotIndex: 0, wordInLOP: 'cat', scriptType: 'Roman',
    })).toBeNull();
  });
});
