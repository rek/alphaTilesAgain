import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_colors.txt';
const EXPECTED_COLS = 3;

/**
 * Parse aa_colors.txt — three columns: Game Color Number, Color Name, Hex Code.
 *
 * Java reference: Start.java buildColorList() (~line 250).
 * Java stores only col[2] (hex) in a flat ArrayList<String> indexed by row order.
 * We expose both the full rows and the Java-compatible hexByIndex flat list.
 *
 * Fixture: engEnglish4/res/raw/aa_colors.txt (13 data rows)
 *
 * @returns `{ rows: Array<{id, name, hex}>, hexByIndex: string[] }`
 */
export function parseColors(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  // Skip header (line 1)
  const dataLines = lines.slice(1);

  const rows = dataLines.map((line, i) => {
    const row = splitRow(line, EXPECTED_COLS, FILE, i + 2);
    return {
      id: row[0],     // col 0 — Game Color Number
      name: row[1],   // col 1 — Color Name
      hex: row[2],    // col 2 — Hex Code (what Java stores in colorList)
    };
  });

  const hexByIndex = rows.map((r) => r.hex);

  return { rows, hexByIndex };
}
