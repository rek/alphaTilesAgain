/**
 * Split a raw file string into non-blank lines.
 *
 * - Accepts \r\n, \r, and \n line endings (mixed is fine).
 * - Strips trailing \r from each line after splitting.
 * - Drops blank / whitespace-only lines regardless of position.
 *
 * The result is suitable for positional slicing: index 0 is the header,
 * indices 1..N are data rows.
 */
export function splitLines(src: string): string[] {
  // Normalise all CR+LF and bare CR to LF, then split.
  const lines = src.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines.filter((line) => line.trim().length > 0);
}
