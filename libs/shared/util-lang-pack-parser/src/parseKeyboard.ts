import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_keyboard.txt';
const EXPECTED_COLS = 2;

/**
 * Parse aa_keyboard.txt — two columns: keys, theme_color.
 *
 * Java reference: Start.java buildKeyList() (~line 640).
 * Each row becomes a Key(key, color) entry.
 *
 * Fixture: engEnglish4/res/raw/aa_keyboard.txt (26 data rows)
 *
 * @returns `{ rows: Array<{ key: string, color: string }> }`
 */
export function parseKeyboard(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const dataLines = lines.slice(1); // skip header

  const rows = dataLines.map((line, i) => {
    const row = splitRow(line, EXPECTED_COLS, FILE, i + 2);
    return {
      key: row[0],    // col 0 — keys
      color: row[1],  // col 1 — theme_color
    };
  });

  return { rows };
}
