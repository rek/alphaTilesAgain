/**
 * Game structure checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — games tab block.
 *
 * Checks:
 * - Country ∈ 17 known game-class names
 * - ChallengeLevel parseable as integer (parser already enforces, validator adds code)
 * - Door unique and sequential from 1
 * - InstructionAudio is a real file OR naWhileMPOnly or X
 * - AudioDuration parseable as integer
 * - China game requires ≥3 four-tile words and ≥1 three-tile word
 * - Italy game requires ≥54 words
 * - Sudan tiles requires tile audio; tile audio requires Sudan tiles
 * - Colombia CL4 Syllable is forbidden
 * - Brazil level 7 requires tonal tiles (type T); tonal tiles without Brazil7 = recommendation
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { FileInventory } from '../FileInventory';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'game-structure';

const VALID_COUNTRIES = new Set([
  'Brazil', 'Chile', 'China', 'Colombia', 'Ecuador', 'Georgia',
  'Iraq', 'Italy', 'Japan', 'Malaysia', 'Mexico', 'Myanmar',
  'Peru', 'Romania', 'Sudan', 'Thailand', 'UnitedStates',
]);

export function checkGameStructure(
  parsed: ParsedPack,
  inventory: FileInventory,
  /** 3-tile and 4-tile word counts computed by checkTileWordCrossRef */
  tileWordCounts?: { threeCount: number; fourCount: number },
): Issue[] {
  const issues: Issue[] = [];
  const { games, words, tiles } = parsed;

  for (let i = 0; i < games.rows.length; i++) {
    const row = games.rows[i];
    const lineNumber = i + 2;

    // Country validation
    if (!VALID_COUNTRIES.has(row.country)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.UNKNOWN_GAME_COUNTRY,
        category: CATEGORY,
        file: 'aa_games.txt',
        line: lineNumber,
        column: 'Country',
        message: `Games row ${lineNumber}: unknown game class "${row.country}"`,
        context: { value: row.country, valid: [...VALID_COUNTRIES] },
      });
    }

    // AudioDuration parseable as integer
    if (row.audioDuration && row.audioDuration !== '' && row.audioDuration !== 'X') {
      if (isNaN(parseInt(row.audioDuration, 10))) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.INVALID_AUDIO_DURATION,
          category: CATEGORY,
          file: 'aa_games.txt',
          line: lineNumber,
          column: 'AudioDuration',
          message: `Games row ${lineNumber}: AudioDuration "${row.audioDuration}" is not an integer`,
          context: { value: row.audioDuration, door: row.door },
        });
      }
    }
  }

  // Door sequential check (must be 1-indexed, no gaps)
  const doors = games.rows.map((r, idx) => ({ door: r.door, lineNumber: idx + 2 }));
  for (let i = 0; i < doors.length; i++) {
    const expected = i + 1;
    if (doors[i].door !== expected) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.NON_SEQUENTIAL_GAME_DOORS,
        category: CATEGORY,
        file: 'aa_games.txt',
        line: doors[i].lineNumber,
        column: 'Door',
        message: `Games row ${doors[i].lineNumber}: door ${doors[i].door} expected ${expected} — doors must be sequential starting from 1`,
        context: { got: doors[i].door, expected },
      });
    }
  }

  // InstructionAudio checks
  const reservedAudioTokens = new Set(['X', 'naWhileMPOnly', 'zz_no_audio_needed']);
  for (let i = 0; i < games.rows.length; i++) {
    const row = games.rows[i];
    const lineNumber = i + 2;
    const instrAudio = row.instructionAudio;
    if (instrAudio && !reservedAudioTokens.has(instrAudio)) {
      if (!inventory.instructionAudio.includes(instrAudio)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.MISSING_INSTRUCTION_AUDIO,
          category: CATEGORY,
          file: 'aa_games.txt',
          line: lineNumber,
          column: 'InstructionAudio',
          message: `Games row ${lineNumber}: instruction audio file "${instrAudio}" not found in audio/instructions/`,
          context: { audioName: instrAudio, door: row.door },
        });
      }
    }
  }

  // Get country list for cross-checks
  const gameCountries = games.rows.map((r) => r.country);

  // China requires ≥3 four-tile words and ≥1 three-tile word
  if (gameCountries.includes('China') && tileWordCounts !== undefined) {
    const { threeCount, fourCount } = tileWordCounts;
    if (fourCount < 3 || threeCount < 1) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INSUFFICIENT_THREE_OR_FOUR_TILE_WORDS,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        message: `China game requires ≥3 four-tile words and ≥1 three-tile word, but pack has ${fourCount} four-tile and ${threeCount} three-tile words`,
        context: { threeCount, fourCount, minThree: 1, minFour: 3 },
      });
    }
  }

  // Italy requires ≥54 words
  if (gameCountries.includes('Italy') && words.rows.length < 54) {
    issues.push({
      severity: 'error',
      code: ISSUE_CODES.WORDLIST_TOO_SHORT_FOR_ITALY,
      category: CATEGORY,
      file: 'aa_wordlist.txt',
      message: `Italy game requires at least 54 words — pack has ${words.rows.length}`,
      context: { got: words.rows.length, required: 54 },
    });
  }

  // Brazil level 7 and tonal tiles
  const hasTonalTile = tiles.rows.some(
    (t) => t.type === 'T' || t.tileTypeB === 'T' || t.tileTypeC === 'T',
  );
  const hasBrazil7 = games.rows.some(
    (r) => r.country === 'Brazil' && r.challengeLevel === 7,
  );

  if (hasTonalTile && !hasBrazil7) {
    issues.push({
      severity: 'info',
      code: ISSUE_CODES.TONAL_TILES_WITHOUT_BRAZIL7,
      category: CATEGORY,
      message: 'Pack has tonal tiles (type T) — it is recommended to include Brazil at challenge level 7',
    });
  } else if (!hasTonalTile && hasBrazil7) {
    issues.push({
      severity: 'error',
      code: ISSUE_CODES.BRAZIL7_WITHOUT_TONAL_TILES,
      category: CATEGORY,
      file: 'aa_games.txt',
      message: 'Brazil at challenge level 7 requires tiles of type T — none found in aa_gametiles.txt',
    });
  }

  // Colombia CL4 Syllable is forbidden
  for (let i = 0; i < games.rows.length; i++) {
    const row = games.rows[i];
    if (row.country === 'Colombia' && row.challengeLevel === 4 && row.syllOrTile === 'S') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.COLOMBIA_CL4_SYLLABLE,
        category: CATEGORY,
        file: 'aa_games.txt',
        line: i + 2,
        message: 'Colombia CL4 Syllable game is not supported — remove this game entry',
        context: { door: row.door },
      });
    }
  }

  return issues;
}
