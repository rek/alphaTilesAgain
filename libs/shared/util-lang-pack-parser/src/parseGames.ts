import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_games.txt';
const EXPECTED_COLS = 8;

/**
 * Parse aa_games.txt — eight columns:
 * Door, Country, ChallengeLevel, Color, InstructionAudio, AudioDuration, SyllOrTile, StagesIncluded.
 *
 * Java reference: Start.java buildGameList() (~line 664).
 * - Door and ChallengeLevel stored as numbers (matches Java Game constructor usage).
 * - Color stored as string (consumers use colorList.get(Integer.parseInt(color))).
 * - SyllOrTile must be 'T' or 'S'; other values throw.
 * - StagesIncluded stored as raw string (typically '-').
 *
 * Fixture: engEnglish4/res/raw/aa_games.txt (90 data rows)
 *
 * @returns `{ rows: Array<{door, country, challengeLevel, color, instructionAudio, audioDuration, syllOrTile, stagesIncluded}> }`
 */
export function parseGames(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const dataLines = lines.slice(1); // skip header

  const rows = dataLines.map((line, i) => {
    const lineNumber = i + 2;
    const row = splitRow(line, EXPECTED_COLS, FILE, lineNumber);

    const door = parseInt(row[0], 10);      // col 0 — Door (number)
    if (isNaN(door)) {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: 'Door',
        reason: 'integer expected',
      });
    }

    const challengeLevel = parseInt(row[2], 10); // col 2 — ChallengeLevel (number)
    if (isNaN(challengeLevel)) {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: 'ChallengeLevel',
        reason: 'integer expected',
      });
    }

    const syllOrTileRaw = row[6]; // col 6 — SyllOrTile
    if (syllOrTileRaw !== 'T' && syllOrTileRaw !== 'S') {
      throw new LangPackParseError({
        file: FILE,
        line: lineNumber,
        column: 'SyllOrTile',
        reason: 'expected T or S',
      });
    }
    const syllOrTile = syllOrTileRaw as 'T' | 'S';

    return {
      door,                            // col 0 — Door
      country: row[1],                 // col 1 — Country
      challengeLevel,                  // col 2 — ChallengeLevel
      color: row[3],                   // col 3 — Color (string; cast to int at call site)
      instructionAudio: row[4],        // col 4 — InstructionAudio
      audioDuration: row[5],           // col 5 — AudioDuration (string; cast at call site)
      syllOrTile,                      // col 6 — SyllOrTile ('T' | 'S')
      stagesIncluded: row[7],          // col 7 — StagesIncluded
    };
  });

  return { rows };
}
