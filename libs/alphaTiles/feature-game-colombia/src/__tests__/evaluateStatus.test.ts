import { evaluateStatus } from '../evaluateStatus';
import { makeTile, makeParsed, makeSyllable } from './fixtures';

const SCRIPT = 'Roman' as const;
const PLACEHOLDER = '◌';

describe('evaluateStatus', () => {
  const tiles = [makeTile('c', 'C'), makeTile('a', 'V'), makeTile('t', 'C')];
  const parsedCat = [
    makeParsed('c', 'C'),
    makeParsed('a', 'V'),
    makeParsed('t', 'C'),
  ];
  const refWord = { wordInLOP: 'cat', mixedDefs: '0' };

  it('returns yellow when no tiles clicked yet', () => {
    const r = evaluateStatus({
      level: 1, variant: 'T',
      clickedKeys: [], tilesInBuiltWord: [],
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles, scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('yellow');
    expect(r.isWin).toBe(false);
  });

  it('returns yellow on correct prefix in T-CL1', () => {
    const r = evaluateStatus({
      level: 1, variant: 'T',
      clickedKeys: [{ text: 'c' }, { text: 'a' }],
      tilesInBuiltWord: [parsedCat[0], parsedCat[1]],
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles, scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('yellow');
  });

  it('returns gray when typed text is not a prefix of correct', () => {
    const r = evaluateStatus({
      level: 1, variant: 'T',
      clickedKeys: [{ text: 'x' }],
      tilesInBuiltWord: [makeParsed('x', 'C')],
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles: [...tiles, makeTile('x', 'C')],
      scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('gray');
  });

  it('returns green/win when typed equals correctString', () => {
    const r = evaluateStatus({
      level: 1, variant: 'T',
      clickedKeys: parsedCat.map((p) => ({ text: p.base })),
      tilesInBuiltWord: parsedCat,
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles, scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('green');
    expect(r.isWin).toBe(true);
  });

  it('CL3-T: yellow on prefix path even with tile-identity mismatch', () => {
    const r = evaluateStatus({
      level: 3, variant: 'T',
      clickedKeys: [{ text: 'c' }],
      tilesInBuiltWord: [],
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles, scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('yellow');
  });

  it('S-CL1: yellow when displayed text matches prefix exactly', () => {
    const sylKa = makeSyllable('ka');
    const sylKe = makeSyllable('ke');
    const tilesForK = [makeTile('k', 'C'), makeTile('a', 'V'), makeTile('e', 'V')];
    const r = evaluateStatus({
      level: 1, variant: 'S',
      clickedKeys: [{ text: 'ka' }],
      tilesInBuiltWord: [],
      parsedTiles: [], parsedSyllables: [sylKa, sylKe],
      refWord: { wordInLOP: 'kake', mixedDefs: '0' },
      tiles: tilesForK,
      scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('yellow');
  });

  it('S-CL1: gray when text-prefix mismatches', () => {
    const sylKa = makeSyllable('ka');
    const sylKe = makeSyllable('ke');
    const tilesForK = [makeTile('k', 'C'), makeTile('a', 'V'), makeTile('e', 'V')];
    const r = evaluateStatus({
      level: 1, variant: 'S',
      clickedKeys: [{ text: 'ke' }],
      tilesInBuiltWord: [],
      parsedTiles: [], parsedSyllables: [sylKa, sylKe],
      refWord: { wordInLOP: 'kake', mixedDefs: '0' },
      tiles: tilesForK,
      scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('gray');
  });

  it('returns gray when overlong (attempt longer than correct)', () => {
    const r = evaluateStatus({
      level: 1, variant: 'T',
      clickedKeys: [
        { text: 'c' }, { text: 'a' }, { text: 't' }, { text: 's' },
      ],
      tilesInBuiltWord: [
        parsedCat[0], parsedCat[1], parsedCat[2], makeParsed('s', 'C'),
      ],
      parsedTiles: parsedCat, parsedSyllables: [],
      refWord, tiles: [...tiles, makeTile('s', 'C')],
      scriptType: SCRIPT, placeholderCharacter: PLACEHOLDER,
    });
    expect(r.color).toBe('gray');
  });
});
