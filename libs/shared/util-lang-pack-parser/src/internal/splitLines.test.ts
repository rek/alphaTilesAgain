import { splitLines } from './splitLines';

describe('splitLines', () => {
  it('splits LF-only input', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('splits CRLF input', () => {
    expect(splitLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
  });

  it('splits bare CR input', () => {
    expect(splitLines('a\rb\rc')).toEqual(['a', 'b', 'c']);
  });

  it('handles mixed line endings', () => {
    expect(splitLines('a\r\nb\nc\rd')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('drops trailing blank lines', () => {
    expect(splitLines('a\nb\n\n')).toEqual(['a', 'b']);
  });

  it('drops internal blank lines', () => {
    expect(splitLines('a\n\nb\n\nc')).toEqual(['a', 'b', 'c']);
  });

  it('drops whitespace-only lines', () => {
    expect(splitLines('a\n   \nb')).toEqual(['a', 'b']);
  });

  it('returns empty array for empty string', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('returns empty array for all-blank string', () => {
    expect(splitLines('\n\n\n')).toEqual([]);
  });

  it('preserves content with internal tabs', () => {
    const result = splitLines('a\tb\tc\nd\te\tf');
    expect(result).toEqual(['a\tb\tc', 'd\te\tf']);
  });
});
