/**
 * Duplicate-detection checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — checkColForDuplicates() calls
 * on gametiles col 0, wordlist cols 0+1, settings col 0, syllables col 0.
 * Also: per-row duplicate among (base, alt1, alt2, alt3) in gametiles and syllables.
 *
 * Checks:
 * - Duplicate tile base keys (col 0 of gametiles)
 * - Duplicate word LWC keys (col 0 of wordlist)
 * - Duplicate syllable keys (col 0 of syllables)
 * - Same value appearing in multiple of (base, alt1, alt2, alt3) on a tile row
 * - Duplicate game door numbers
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'duplicates';

export function checkDuplicates(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];

  // Duplicate tile base keys
  const tileKeySeen = new Set<string>();
  const tileDupSeen = new Set<string>();
  for (const row of parsed.tiles.rows) {
    if (tileKeySeen.has(row.base)) {
      if (!tileDupSeen.has(row.base)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.DUPLICATE_TILE_KEY,
          category: CATEGORY,
          file: 'aa_gametiles.txt',
          message: `Tile key "${row.base}" appears more than once in column 1 of aa_gametiles.txt`,
          context: { key: row.base },
        });
        tileDupSeen.add(row.base);
      }
    } else {
      tileKeySeen.add(row.base);
    }
  }

  // Duplicate word LWC keys
  const wordKeySeen = new Set<string>();
  const wordDupSeen = new Set<string>();
  for (const row of parsed.words.rows) {
    if (wordKeySeen.has(row.wordInLWC)) {
      if (!wordDupSeen.has(row.wordInLWC)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.DUPLICATE_WORD_KEY,
          category: CATEGORY,
          file: 'aa_wordlist.txt',
          message: `Word LWC key "${row.wordInLWC}" appears more than once in column 1 of aa_wordlist.txt`,
          context: { key: row.wordInLWC },
        });
        wordDupSeen.add(row.wordInLWC);
      }
    } else {
      wordKeySeen.add(row.wordInLWC);
    }
  }

  // Duplicate syllable keys
  const syllKeySeen = new Set<string>();
  const syllDupSeen = new Set<string>();
  for (const row of parsed.syllables.rows) {
    if (syllKeySeen.has(row.syllable)) {
      if (!syllDupSeen.has(row.syllable)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.DUPLICATE_SYLLABLE_KEY,
          category: CATEGORY,
          file: 'aa_syllables.txt',
          message: `Syllable key "${row.syllable}" appears more than once in column 1 of aa_syllables.txt`,
          context: { key: row.syllable },
        });
        syllDupSeen.add(row.syllable);
      }
    } else {
      syllKeySeen.add(row.syllable);
    }
  }

  // Same value in (base, alt1, alt2, alt3) on a tile row
  for (let i = 0; i < parsed.tiles.rows.length; i++) {
    const row = parsed.tiles.rows[i];
    const alternates = [row.base, row.alt1, row.alt2, row.alt3];
    const uniqueAlts = new Set(alternates);
    if (uniqueAlts.size < alternates.length) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.TILE_SELF_DUPLICATE_DISTRACTOR,
        category: CATEGORY,
        file: 'aa_gametiles.txt',
        line: i + 2,
        message: `Row ${i + 2} of aa_gametiles.txt has the same tile value appearing in multiple places among (base, alt1, alt2, alt3): [${alternates.join(', ')}]`,
        context: { base: row.base, alt1: row.alt1, alt2: row.alt2, alt3: row.alt3 },
      });
    }
  }

  // Duplicate game door numbers
  const doorSeen = new Set<number>();
  const doorDupSeen = new Set<number>();
  for (const row of parsed.games.rows) {
    if (doorSeen.has(row.door)) {
      if (!doorDupSeen.has(row.door)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.DUPLICATE_GAME_DOOR,
          category: CATEGORY,
          file: 'aa_games.txt',
          message: `Game door number ${row.door} appears more than once in aa_games.txt`,
          context: { door: row.door },
        });
        doorDupSeen.add(row.door);
      }
    } else {
      doorSeen.add(row.door);
    }
  }

  return issues;
}
