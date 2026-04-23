import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_resources.txt';
const EXPECTED_COLS = 3;

/**
 * Parse aa_resources.txt — three columns: Name, Link, Image.
 *
 * Java reference: used in Resources.java; no dedicated build method in Start.java.
 * Fixture: engEnglish4/res/raw/aa_resources.txt (1 data row)
 *
 * @returns `{ rows: Array<{ name: string, link: string, image: string }> }`
 */
export function parseResources(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const dataLines = lines.slice(1); // skip header

  const rows = dataLines.map((line, i) => {
    const row = splitRow(line, EXPECTED_COLS, FILE, i + 2);
    return {
      name: row[0],   // col 0 — Name
      link: row[1],   // col 1 — Link
      image: row[2],  // col 2 — Image
    };
  });

  return { rows };
}
