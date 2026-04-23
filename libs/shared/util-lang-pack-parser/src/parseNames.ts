import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_names.txt';
const EXPECTED_COLS = 2;

/**
 * Parse aa_names.txt — two columns: Entry, Name.
 *
 * Java reference: Start.java buildAvatarNameList() (~line 749).
 * Java stores col[1] (Name) in an AvatarNameList. An empty file (header only)
 * is valid — it means the pack uses the generic "Player" label instead of
 * custom avatar names.
 *
 * Fixture: engEnglish4/res/raw/aa_names.txt (header only, zero data rows)
 *
 * @returns `{ rows: Array<{ entry: string, name: string }> }` — may be empty.
 */
export function parseNames(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const dataLines = lines.slice(1); // skip header — empty is valid

  const rows = dataLines.map((line, i) => {
    const row = splitRow(line, EXPECTED_COLS, FILE, i + 2);
    return {
      entry: row[0],  // col 0 — Entry
      name: row[1],   // col 1 — Name (what Java stores)
    };
  });

  return { rows };
}
