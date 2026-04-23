/**
 * Color reference checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — keyboard color check block.
 *
 * Checks:
 * - Keyboard color indices within 0..colorList.length-1
 * - Tile col-12 (tileColor) within range
 * - Game col-3 (color) within range
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'color-reference';

export function checkColorReferences(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const colorCount = parsed.colors.rows.length;

  // Keyboard colors
  for (let i = 0; i < parsed.keys.rows.length; i++) {
    const row = parsed.keys.rows[i];
    const colorIdx = parseInt(row.color, 10);
    if (isNaN(colorIdx) || colorIdx < 0 || colorIdx >= colorCount) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_KEYBOARD_COLOR_INDEX,
        category: CATEGORY,
        file: 'aa_keyboard.txt',
        line: i + 2,
        column: 'theme_color',
        message: `Keyboard row ${i + 2}: color index "${row.color}" is out of range (colorList has ${colorCount} entries, valid: 0..${colorCount - 1})`,
        context: { value: row.color, colorCount, key: row.key },
      });
    }
  }

  // Tile colors (col 12 = tileColor)
  for (let i = 0; i < parsed.tiles.rows.length; i++) {
    const row = parsed.tiles.rows[i];
    if (!row.tileColor || row.tileColor === '' || row.tileColor === 'X') continue;
    const colorIdx = parseInt(row.tileColor, 10);
    if (isNaN(colorIdx) || colorIdx < 0 || colorIdx >= colorCount) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_TILE_COLOR_INDEX,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: i + 2,
        column: 'tileColor',
        message: `Gametiles row ${i + 2} (tile "${row.base}"): tileColor "${row.tileColor}" is out of range (colorList has ${colorCount} entries)`,
        context: { value: row.tileColor, colorCount, tile: row.base },
      });
    }
  }

  // Game colors (col 3 = color)
  for (let i = 0; i < parsed.games.rows.length; i++) {
    const row = parsed.games.rows[i];
    if (!row.color || row.color === '') continue;
    const colorIdx = parseInt(row.color, 10);
    if (isNaN(colorIdx) || colorIdx < 0 || colorIdx >= colorCount) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_GAME_COLOR_INDEX,
        category: CATEGORY,
        file: 'aa_games.txt',
        line: i + 2,
        column: 'Color',
        message: `Games row ${i + 2} (door ${row.door}): color "${row.color}" is out of range (colorList has ${colorCount} entries)`,
        context: { value: row.color, colorCount, door: row.door },
      });
    }
  }

  return issues;
}
