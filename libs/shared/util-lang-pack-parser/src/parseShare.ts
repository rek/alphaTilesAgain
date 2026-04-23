import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';

/**
 * Parse aa_share.txt — a two-line file: a header row ("Link") and a single
 * data row containing the store / share URL.
 *
 * Java reference: no dedicated buildX method; accessed as a one-off raw-resource read.
 * Fixture: engEnglish4/res/raw/aa_share.txt
 *
 * @returns The bare share-link string.
 */
export function parseShare(src: string): string {
  const lines = splitLines(src);
  if (lines.length < 2) {
    throw new LangPackParseError({
      file: 'aa_share.txt',
      line: lines.length + 1,
      reason: 'expected at least 2 lines (header + link)',
    });
  }
  // col 0 — Link
  return lines[1].trim();
}
