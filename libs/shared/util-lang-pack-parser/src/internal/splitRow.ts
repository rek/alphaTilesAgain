import { LangPackParseError } from '../LangPackParseError';

/**
 * Split a tab-delimited row and validate the column count.
 *
 * Rules (see design.md §D4):
 * - Cells are trimmed of leading/trailing whitespace (matching Java Scanner token behaviour).
 * - If split length === expectedColumns: accepted.
 * - If split length > expectedColumns and all extra cells are empty: accepted (trailing tabs).
 * - If split length > expectedColumns and any extra cell is non-empty: rejected (new unknown data).
 * - If split length < expectedColumns: rejected (data truncation).
 *
 * @param line - Raw tab-delimited line (no trailing newline expected).
 * @param expectedColumns - Number of columns the parser expects.
 * @param fileName - Used in the thrown LangPackParseError.
 * @param lineNumber - 1-based line number, used in the thrown LangPackParseError.
 */
export function splitRow(
  line: string,
  expectedColumns: number,
  fileName: string,
  lineNumber: number,
): string[] {
  const raw = line.split('\t');
  const cells = raw.map((c) => c.trim());

  if (cells.length === expectedColumns) {
    return cells;
  }

  if (cells.length > expectedColumns) {
    // Accept if all extra columns are empty (trailing tabs).
    const extras = cells.slice(expectedColumns);
    const hasNonEmptyExtra = extras.some((c) => c.length > 0);
    if (!hasNonEmptyExtra) {
      return cells.slice(0, expectedColumns);
    }
    throw new LangPackParseError({
      file: fileName,
      line: lineNumber,
      expected: expectedColumns,
      got: cells.length,
      reason: 'row has extra non-empty columns',
    });
  }

  // cells.length < expectedColumns
  throw new LangPackParseError({
    file: fileName,
    line: lineNumber,
    expected: expectedColumns,
    got: cells.length,
  });
}
