/**
 * Tile-word cross-reference checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — gametiles+wordlist cross-ref block.
 *
 * Checks:
 * - Every word's LOP parses into known tiles (via parseWordIntoTilesPreliminary)
 * - Words with > 15 tiles → error WORD_TOO_LONG_FOR_GAMES
 * - Words with 10-15 tiles → info WORD_LONGER_THAN_IDEAL
 * - Count 3-tile and 4-tile words (for China game check in checkGameStructure)
 * - Tile usage counts: tiles used < NUM_TIMES_TILES_WANTED_IN_WORDS (5) → info TILE_UNDERUSED
 *
 * Returns issues + auxiliary data (threeCount, fourCount) for use by checkGameStructure.
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';
import {
  parseWordIntoTilesPreliminary,
  getMultitypeTiles,
  buildTileHashMap,
} from '@shared/util-phoneme';
import type { TileEntry } from '@shared/util-phoneme';

const CATEGORY = 'tile-word-cross-ref';
// Java constant: NUM_TIMES_TILES_WANTED_IN_WORDS = 5
const NUM_TIMES_TILES_WANTED = 5;

export interface CrossRefResult {
  issues: Issue[];
  threeCount: number;
  fourCount: number;
}

export function checkTileWordCrossRef(
  parsed: ParsedPack,
  placeholderCharacter = '◌',
): CrossRefResult {
  const issues: Issue[] = [];
  const { tiles, words } = parsed;

  if (tiles.rows.length === 0) return { issues, threeCount: 0, fourCount: 0 };

  // Build tile structures for phoneme parsing
  const tileEntries: TileEntry[] = tiles.rows.map((r) => ({
    base: r.base,
    alt1: r.alt1,
    alt2: r.alt2,
    alt3: r.alt3,
    type: r.type,
    tileTypeB: r.tileTypeB,
    tileTypeC: r.tileTypeC,
    stageOfFirstAppearance: r.stageOfFirstAppearance,
    stageOfFirstAppearanceType2: r.stageOfFirstAppearanceType2,
    stageOfFirstAppearanceType3: r.stageOfFirstAppearanceType3,
    audioName: r.audioName,
    audioNameB: r.audioNameB,
    audioNameC: r.audioNameC,
  }));

  const tileMap = buildTileHashMap(tileEntries, placeholderCharacter);
  const multitypeTiles = getMultitypeTiles(tileEntries);

  // Tile usage count
  const tileUsage = new Map<string, number>();
  for (const t of tileEntries) tileUsage.set(t.base, 0);

  let threeCount = 0;
  let fourCount = 0;
  let longWordCount = 0;

  for (let i = 0; i < words.rows.length; i++) {
    const word = words.rows[i];
    const lineNumber = i + 2;

    const preliminary = parseWordIntoTilesPreliminary(
      word.wordInLOP,
      word.mixedDefs,
      tileMap,
      multitypeTiles,
      placeholderCharacter,
    );

    if (preliminary === null) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.WORD_CANNOT_PARSE_INTO_TILES,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        message: `Word "${word.wordInLOP}" cannot be parsed into tiles from aa_gametiles.txt`,
        context: {
          word: word.wordInLOP,
          wordInLWC: word.wordInLWC,
        },
      });
      continue;
    }

    const numTiles = preliminary.length;

    // Count 3- and 4-tile words for China check
    if (numTiles === 3) threeCount++;
    else if (numTiles === 4) fourCount++;

    // Word too long
    if (numTiles > 15) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.WORD_TOO_LONG_FOR_GAMES,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        message: `Word "${word.wordInLOP}" takes ${numTiles} tiles to build — maximum is 15`,
        context: { word: word.wordInLOP, tileCount: numTiles, max: 15 },
      });
    } else if (numTiles >= 10) {
      longWordCount++;
    }

    // Count tile usage
    for (const parsedTile of preliminary) {
      if (tileUsage.has(parsedTile.base)) {
        tileUsage.set(parsedTile.base, (tileUsage.get(parsedTile.base) ?? 0) + 1);
      }
    }
  }

  if (longWordCount > 0) {
    issues.push({
      severity: 'info',
      code: ISSUE_CODES.WORD_LONGER_THAN_IDEAL,
      category: CATEGORY,
      message: `The wordlist has ${longWordCount} long word(s) (10–15 tiles) — shorter words are preferable in early literacy games`,
      context: { count: longWordCount },
    });
  }

  // Tile underuse
  for (const [tileBase, count] of tileUsage) {
    if (count < NUM_TIMES_TILES_WANTED) {
      issues.push({
        severity: 'info',
        code: ISSUE_CODES.TILE_UNDERUSED,
        category: CATEGORY,
        message: `Tile "${tileBase}" appears in only ${count} word(s) — recommended minimum is ${NUM_TIMES_TILES_WANTED}`,
        context: { tile: tileBase, count, minimum: NUM_TIMES_TILES_WANTED },
      });
    }
  }

  return { issues, threeCount, fourCount };
}
