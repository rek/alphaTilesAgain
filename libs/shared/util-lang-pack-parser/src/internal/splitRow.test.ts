import { LangPackParseError } from '../LangPackParseError';
import { splitRow } from './splitRow';

describe('splitRow', () => {
  it('returns exact match', () => {
    expect(splitRow('a\tb\tc', 3, 'f.txt', 1)).toEqual(['a', 'b', 'c']);
  });

  it('trims leading/trailing whitespace per cell', () => {
    expect(splitRow(' a \t b \t c ', 3, 'f.txt', 1)).toEqual(['a', 'b', 'c']);
  });

  it('accepts trailing empty tabs (row length > expected but extras are empty)', () => {
    // "a\tb\tc\t" split → ['a','b','c',''] — extra is empty, accept
    expect(splitRow('a\tb\tc\t', 3, 'f.txt', 1)).toEqual(['a', 'b', 'c']);
  });

  it('accepts multiple trailing empty tabs', () => {
    expect(splitRow('a\tb\tc\t\t', 3, 'f.txt', 1)).toEqual(['a', 'b', 'c']);
  });

  it('rejects row shorter than expected', () => {
    expect(() => splitRow('a\tb', 3, 'aa_gametiles.txt', 5)).toThrow(LangPackParseError);
  });

  it('carries correct file/line/expected/got in short-row error', () => {
    try {
      splitRow('a\tb', 3, 'aa_gametiles.txt', 5);
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(LangPackParseError);
      const err = e as LangPackParseError;
      expect(err.file).toBe('aa_gametiles.txt');
      expect(err.line).toBe(5);
      expect(err.expected).toBe(3);
      expect(err.got).toBe(2);
    }
  });

  it('rejects row with extra non-empty columns', () => {
    expect(() => splitRow('a\tb\tc\td', 3, 'f.txt', 1)).toThrow(LangPackParseError);
  });

  it('carries correct expected/got in extra-columns error', () => {
    try {
      splitRow('a\tb\tc\td', 3, 'f.txt', 1);
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(LangPackParseError);
      const err = e as LangPackParseError;
      expect(err.expected).toBe(3);
      expect(err.got).toBe(4);
    }
  });
});
