import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_syllables.txt';
const EXPECTED_COLS = 7;

/**
 * Parse aa_syllables.txt — seven columns:
 * Syllable, Or1, Or2, Or3, SyllableAudioName, Duration, Color.
 *
 * Java reference: Start.java buildSyllableList() (~line 409).
 * Java calls Integer.parseInt(thisLineArray[5]) for duration.
 * An empty syllable table (header only) is valid for packs that use tile-mode only.
 *
 * Fixture: engEnglish4/res/raw/aa_syllables.txt (header only)
 *
 * @returns `{ rows: Array<{ syllable, distractors:[a,b,c], audioName, duration, color }> }`
 */
export function parseSyllables(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const dataLines = lines.slice(1); // skip header — empty is valid

  const rows = dataLines.map((line, i) => {
    const lineNumber = i + 2;
    const row = splitRow(line, EXPECTED_COLS, FILE, lineNumber);

    const rawDuration = row[5]; // col 5 — Duration
    const duration = parseInt(rawDuration, 10);
    if (isNaN(duration)) {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: 'Duration',
        reason: 'integer expected',
      });
    }

    return {
      syllable: row[0],                      // col 0 — Syllable
      distractors: [row[1], row[2], row[3]] as [string, string, string],  // cols 1-3 — Or1/Or2/Or3
      audioName: row[4],                     // col 4 — SyllableAudioName
      duration,                              // col 5 — Duration (parsed as int)
      color: row[6],                         // col 6 — Color
    };
  });

  return { rows };
}
