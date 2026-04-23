import { LangPackParseError } from './LangPackParseError';

describe('LangPackParseError', () => {
  it('builds message from file + line', () => {
    const e = new LangPackParseError({ file: 'aa_gametiles.txt', line: 3 });
    expect(e.message).toContain('aa_gametiles.txt');
    expect(e.message).toContain('line 3');
    expect(e.name).toBe('LangPackParseError');
  });

  it('includes expected/got in message when provided', () => {
    const e = new LangPackParseError({ file: 'aa_gametiles.txt', line: 5, expected: 17, got: 15 });
    expect(e.message).toContain('expected 17 columns, got 15');
    expect(e.expected).toBe(17);
    expect(e.got).toBe(15);
  });

  it('includes column name in message', () => {
    const e = new LangPackParseError({ file: 'aa_games.txt', line: 2, column: 'SyllOrTile', reason: 'expected T or S' });
    expect(e.message).toContain('SyllOrTile');
    expect(e.message).toContain('expected T or S');
    expect(e.column).toBe('SyllOrTile');
    expect(e.reason).toBe('expected T or S');
  });

  it('retains all fields', () => {
    const e = new LangPackParseError({ file: 'f', line: 1, expected: 3, got: 2, column: 'c', reason: 'r' });
    expect(e.file).toBe('f');
    expect(e.line).toBe(1);
    expect(e.expected).toBe(3);
    expect(e.got).toBe(2);
    expect(e.column).toBe('c');
    expect(e.reason).toBe('r');
  });

  it('is instanceof Error and LangPackParseError', () => {
    const e = new LangPackParseError({ file: 'x', line: 1 });
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(LangPackParseError);
  });
});
