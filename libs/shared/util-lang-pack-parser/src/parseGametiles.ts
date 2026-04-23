import { LangPackParseError } from './LangPackParseError';
import { splitLines } from './internal/splitLines';
import { splitRow } from './internal/splitRow';

const FILE = 'aa_gametiles.txt';
const EXPECTED_COLS = 17;

/**
 * Clamp / parse a stage column value.
 *
 * Java reference (Start.java ~line 310):
 * ```java
 * if (!thisLineArray[14].matches("[0-9]+")) {
 *   stageOfFirstAppearance = 1;
 * } else {
 *   stageOfFirstAppearance = Integer.parseInt(thisLineArray[14]);
 *   if (!(stageOfFirstAppearance >= 1 && stageOfFirstAppearance <= 7)) {
 *     stageOfFirstAppearance = 1;
 *   }
 * }
 * ```
 * Non-numeric values and out-of-range values (< 1 or > 7) all fall back to 1.
 */
function parseStageIntOrOne(raw: string): number {
  if (!/^[0-9]+$/.test(raw)) return 1;
  const n = parseInt(raw, 10);
  return n >= 1 && n <= 7 ? n : 1;
}

/**
 * Parse aa_gametiles.txt — 17 columns:
 * tiles, Or1, Or2, Or3, Type, AudioName, Upper, Type2, AudioName2,
 * Type3, AudioName3, Placeholder(iconicWord), Placeholder(tileColor),
 * Placeholder, FirstAppearsInStage, FirstAppearsInStage(Type2), FirstAppearsInStage(Type3).
 *
 * Java reference: Start.java buildTileList() (~line 273).
 * - Columns 12–13 are documented as 'Placeholder' in the file header; Java reads
 *   [12] as tileColor (integer — but stored as 0 in the Tile constructor, so we
 *   preserve the raw string). Col [13] is unused.
 * - Stage columns (14–16) are parsed with the Java clamp logic above.
 *
 * Fixture: engEnglish4/res/raw/aa_gametiles.txt (39 data rows)
 *
 * @returns `{ headers, rows: Array<TileRow> }`
 */
export function parseGametiles(src: string) {
  const lines = splitLines(src);
  if (lines.length === 0) {
    throw new LangPackParseError({ file: FILE, line: 0, reason: 'file is empty' });
  }

  const headerRow = splitRow(lines[0], EXPECTED_COLS, FILE, 1);
  const headers = {
    base: headerRow[0],
    alt1: headerRow[1],
    alt2: headerRow[2],
    alt3: headerRow[3],
    type: headerRow[4],
    audioName: headerRow[5],
    upper: headerRow[6],
    tileTypeB: headerRow[7],
    audioNameB: headerRow[8],
    tileTypeC: headerRow[9],
    audioNameC: headerRow[10],
    iconicWord: headerRow[11],
    tileColor: headerRow[12],
    placeholder13: headerRow[13],
    stageOfFirstAppearance: headerRow[14],
    stageOfFirstAppearanceType2: headerRow[15],
    stageOfFirstAppearanceType3: headerRow[16],
  };

  const dataLines = lines.slice(1);
  const rows = dataLines.map((line, i) => {
    const row = splitRow(line, EXPECTED_COLS, FILE, i + 2);
    return {
      base: row[0],                                          // col 0 — tiles
      alt1: row[1],                                          // col 1 — Or1 (distractor 1)
      alt2: row[2],                                          // col 2 — Or2
      alt3: row[3],                                          // col 3 — Or3
      type: row[4],                                          // col 4 — Type (primary, e.g. 'V', 'C', 'PC')
      audioName: row[5],                                     // col 5 — AudioName (primary)
      upper: row[6],                                         // col 6 — Upper-case form
      tileTypeB: row[7],                                     // col 7 — Type2 ('none' if absent)
      audioNameB: row[8],                                    // col 8 — AudioName2
      tileTypeC: row[9],                                     // col 9 — Type3 ('none' if absent)
      audioNameC: row[10],                                   // col 10 — AudioName3
      iconicWord: row[11],                                   // col 11 — Placeholder (iconic word)
      tileColor: row[12],                                    // col 12 — Placeholder (tile color)
      // col 13 is a second unused Placeholder — not exposed
      stageOfFirstAppearance: parseStageIntOrOne(row[14]),   // col 14 — FirstAppearsInStage
      stageOfFirstAppearanceType2: parseStageIntOrOne(row[15]), // col 15 — FirstAppearsInStage(Type2)
      stageOfFirstAppearanceType3: parseStageIntOrOne(row[16]), // col 16 — FirstAppearsInStage(Type3)
    };
  });

  return { headers, rows };
}
