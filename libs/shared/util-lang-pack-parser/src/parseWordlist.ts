import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_wordlist.txt';
const EXPECTED_COLS = 6;

/**
 * Parse aa_wordlist.txt — six columns:
 * EnglishLWC (wordInLWC), EnglishLOP (wordInLOP), duration placeholder,
 * Mixed-TypeSymbolsInfo (mixedDefs), placeholder, FirstAppearsInStage.
 *
 * Java reference: Start.java buildWordList() (~line 447).
 * - col[0] = wordInLWC
 * - col[1] = wordInLOP
 * - col[2] = duration (Integer.parseInt — must be a valid int)
 * - col[3] = mixedDefs
 * - col[4] = placeholder (ignored in Java — "" used)
 * - col[5] = stageOfFirstAppearance (stored as string; Java matches "[0-9]+" at call site)
 *
 * Fixture: engEnglish4/res/raw/aa_wordlist.txt
 *
 * @returns `{ headers, rows: Array<{ wordInLWC, wordInLOP, duration, mixedDefs, stageOfFirstAppearance }> }`
 */
export function parseWordlist(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const headerRow = splitRow(lines[0], EXPECTED_COLS, FILE, 1);
  const headers = {
    wordInLWC: headerRow[0],      // col 0 — EnglishLWC
    wordInLOP: headerRow[1],      // col 1 — EnglishLOP
    duration: headerRow[2],       // col 2 — duration placeholder header
    mixedDefs: headerRow[3],      // col 3 — Mixed-TypeSymbolsInfo
    placeholder: headerRow[4],    // col 4 — placeholder
    stageOfFirstAppearance: headerRow[5], // col 5 — FirstAppearsInStage
  };

  const dataLines = lines.slice(1);
  const rows = dataLines.map((line, i) => {
    const lineNumber = i + 2;
    const row = splitRow(line, EXPECTED_COLS, FILE, lineNumber);

    const duration = parseInt(row[2], 10);  // col 2 — duration (int)
    if (isNaN(duration)) {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: 'duration',
        reason: 'integer expected',
      });
    }

    return {
      wordInLWC: row[0],               // col 0
      wordInLOP: row[1],               // col 1
      duration,                         // col 2 (parsed as int)
      mixedDefs: row[3],               // col 3
      // col 4 is placeholder — not exposed (matches Java's "" default)
      stageOfFirstAppearance: row[5],  // col 5 (raw string; Java checks "[0-9]+" at call site)
    };
  });

  return { headers, rows };
}
