import { correctForTile } from '../correctForTile';
import { makeParsed } from './testFixtures';

describe('correctForTile', () => {
  it('CL1 returns parsedTiles[0]', () => {
    const parsed = [makeParsed('c'), makeParsed('a', 'V'), makeParsed('t')];
    expect(correctForTile(parsed, 1).base).toBe('c');
  });

  it('CL6 returns parsedTiles[0] (still in 1-6 band)', () => {
    const parsed = [makeParsed('c'), makeParsed('a', 'V')];
    expect(correctForTile(parsed, 6).base).toBe('c');
  });

  it('CL7 skips leading LV → first non-LV tile', () => {
    const parsed = [
      makeParsed('e', 'LV'),
      makeParsed('k', 'C'),
      makeParsed('a', 'V'),
    ];
    expect(correctForTile(parsed, 7).base).toBe('k');
  });

  it('CL7 PC after LV uses preceding LV', () => {
    const parsed = [
      makeParsed('e', 'LV'),
      makeParsed('p', 'PC'),
      makeParsed('a', 'V'),
    ];
    expect(correctForTile(parsed, 7).base).toBe('e');
  });

  it('CL7 PC at start with no preceding LV → parsedTiles[t+1]', () => {
    const parsed = [makeParsed('p', 'PC'), makeParsed('a', 'V')];
    // initialLV is null (no LV walked), so fallback is parsed[t+1] (= 'a').
    expect(correctForTile(parsed, 7).base).toBe('a');
  });

  it('CL12 first non-LV is non-PC → returns it directly', () => {
    const parsed = [
      makeParsed('a', 'LV'),
      makeParsed('e', 'LV'),
      makeParsed('b', 'C'),
    ];
    expect(correctForTile(parsed, 12).base).toBe('b');
  });
});
