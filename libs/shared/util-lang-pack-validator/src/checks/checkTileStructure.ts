/**
 * Tile structure checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — gametiles structure block.
 *
 * Checks:
 * - Type ∈ {C, PC, V, X, D, AD, AV, BV, FV, LV, T, SAD}
 * - Alternates (alt1, alt2, alt3) are in the tile list
 * - Upper-case column consistency (proper-case-only vs full-upper-case-only)
 * - Lowercase 'x' in placeholder columns F, I, K → should be uppercase X
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'tile-structure';

const VALID_TILE_TYPES = new Set([
  'C', 'PC', 'V', 'X', 'D', 'AD', 'AV', 'BV', 'FV', 'LV', 'T', 'SAD',
]);

export function checkTileStructure(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const { tiles } = parsed;

  // Build set of valid tile bases
  const validBases = new Set(tiles.rows.map((r) => r.base));

  // Tiles for uppercase analysis
  const multiPossibleUpperCase: Array<{ upper: string; rowIndex: number }> = [];

  for (let i = 0; i < tiles.rows.length; i++) {
    const row = tiles.rows[i];
    const lineNumber = i + 2;

    // Type check (primary)
    if (!VALID_TILE_TYPES.has(row.type)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_TILE_TYPE,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'Type',
        message: `Row ${lineNumber} (tile "${row.base}"): invalid type "${row.type}" — valid types are ${[...VALID_TILE_TYPES].join(', ')}`,
        context: { tile: row.base, type: row.type, valid: [...VALID_TILE_TYPES] },
      });
    }

    // tileTypeB check
    if (row.tileTypeB && row.tileTypeB !== 'none' && !VALID_TILE_TYPES.has(row.tileTypeB)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_TILE_TYPE,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'Type2',
        message: `Row ${lineNumber} (tile "${row.base}"): invalid tileTypeB "${row.tileTypeB}"`,
        context: { tile: row.base, type: row.tileTypeB },
      });
    }

    // tileTypeC check
    if (row.tileTypeC && row.tileTypeC !== 'none' && !VALID_TILE_TYPES.has(row.tileTypeC)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_TILE_TYPE,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'Type3',
        message: `Row ${lineNumber} (tile "${row.base}"): invalid tileTypeC "${row.tileTypeC}"`,
        context: { tile: row.base, type: row.tileTypeC },
      });
    }

    // Alternate distractors must be in tile list
    for (const [altName, altValue] of [
      ['alt1', row.alt1] as const,
      ['alt2', row.alt2] as const,
      ['alt3', row.alt3] as const,
    ]) {
      if (!validBases.has(altValue)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.INVALID_DISTRACTOR,
          category: CATEGORY,
          file: 'aa_gametiles.txt',
          line: lineNumber,
          column: altName,
          message: `Row ${lineNumber} (tile "${row.base}"): alternate/distractor "${altValue}" is not a valid tile in the tile list`,
          context: { tile: row.base, distractor: altValue, column: altName },
        });
      }
    }

    // Lowercase 'x' in audioName column (should be uppercase X)
    if (row.audioName === 'x') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.LOWERCASE_PLACEHOLDER,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'AudioName',
        message: `Row ${lineNumber}: placeholder in column AudioName (F) should be uppercase X, not lowercase x`,
        context: { tile: row.base, column: 'AudioName' },
      });
    }
    if (row.audioNameB === 'x') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.LOWERCASE_PLACEHOLDER,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'AudioName2',
        message: `Row ${lineNumber}: placeholder in column AudioName2 (I) should be uppercase X, not lowercase x`,
        context: { tile: row.base, column: 'AudioName2' },
      });
    }
    if (row.audioNameC === 'x') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.LOWERCASE_PLACEHOLDER,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: lineNumber,
        column: 'AudioName3',
        message: `Row ${lineNumber}: placeholder in column AudioName3 (K) should be uppercase X, not lowercase x`,
        context: { tile: row.base, column: 'AudioName3' },
      });
    }

    // Upper-case column analysis (collect multi-char-with-case entries)
    const upper = row.upper;
    if (upper && upper.length > 0) {
      // Count chars that have distinct upper/lower forms
      let numCaseable = 0;
      for (const c of upper) {
        if (c.toUpperCase() !== c.toLowerCase()) numCaseable++;
      }
      if (numCaseable > 1) {
        multiPossibleUpperCase.push({ upper, rowIndex: i });
      }
    }
  }

  // Upper-case consistency check
  if (multiPossibleUpperCase.length > 0) {
    const properCaseOnly: string[] = [];
    const fullUpperOnly: string[] = [];
    const other: string[] = [];

    for (const { upper } of multiPossibleUpperCase) {
      const fullUpper = upper.toUpperCase();
      const lc = upper.toLowerCase();
      // proper case: first char upper, rest lower
      const properCase = lc.length > 0 ? lc[0].toUpperCase() + lc.slice(1) : lc;

      if (upper === fullUpper) {
        fullUpperOnly.push(upper);
      } else if (upper === properCase) {
        properCaseOnly.push(upper);
      } else {
        other.push(upper);
      }
    }

    const consistent =
      Math.max(properCaseOnly.length, fullUpperOnly.length) === multiPossibleUpperCase.length;

    if (!consistent) {
      const exFull = fullUpperOnly.slice(0, 5);
      const exProper = properCaseOnly.slice(0, 5);
      const exOther = other.slice(0, 5);
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.INCONSISTENT_UPPERCASE,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        message:
          `The Upper column in gametiles doesn't consistently use proper case or full upper case. ` +
          `Full upper examples: [${exFull.join(', ')}]; Proper case examples: [${exProper.join(', ')}]; Other: [${exOther.join(', ')}]`,
        context: {
          fullUpperExamples: exFull,
          properCaseExamples: exProper,
          otherExamples: exOther,
        },
      });
    }

    if (fullUpperOnly.length > 0) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.FULL_UPPERCASE_WARNING,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        message:
          'Full upper case is used in the Upper column — this may cause unintended formatting (e.g. "CH" for "ch" would show "CHildren")',
        context: { examples: fullUpperOnly.slice(0, 5) },
      });
    }
  }

  return issues;
}
