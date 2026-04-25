/**
 * File-presence checks.
 *
 * Java reference: FilePresence.java + validateResourceSubfolders() in Validator.java.
 *
 * Checks:
 * - Required aa_*.txt files present in rawFiles
 * - At least one TTF under fonts/
 * - Exactly 12 avatars under images/avatars/
 * - Exactly 12 avataricons under images/avataricons/
 */

import type { Issue } from '../Issue';
import type { FileInventory } from '../FileInventory';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'file-presence';

/** Required rawFiles keys (without extension). aa_notes is excluded — validator-only. */
const REQUIRED_RAW_FILES = [
  'aa_colors',
  'aa_games',
  'aa_gametiles',
  'aa_keyboard',
  'aa_langinfo',
  'aa_names',
  'aa_resources',
  'aa_settings',
  'aa_share',
  'aa_syllables',
  'aa_wordlist',
] as const;

export function checkFilePresence(
  rawFiles: Record<string, string>,
  inventory: FileInventory,
): Issue[] {
  const issues: Issue[] = [];

  // Required aa_*.txt files
  for (const key of REQUIRED_RAW_FILES) {
    if (!(key in rawFiles)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.MISSING_REQUIRED_FILE,
        category: CATEGORY,
        message: `Required file ${key}.txt is missing from the pack`,
        file: `${key}.txt`,
        context: { file: `${key}.txt` },
      });
    }
  }

  // At least one font
  const ttfFonts = inventory.fonts.filter((f) =>
    /\.(ttf|otf)$/i.test(f) || !f.includes('.'),
  );
  if (ttfFonts.length === 0) {
    issues.push({
      severity: 'error',
      code: ISSUE_CODES.MISSING_FONT,
      category: CATEGORY,
      message: 'fonts/ must contain at least one .ttf or .otf file',
      context: { got: 0 },
    });
  }

  // Exactly 12 avatars
  if (inventory.avatars.length !== 12) {
    issues.push({
      severity: 'error',
      code: ISSUE_CODES.WRONG_AVATAR_COUNT,
      category: CATEGORY,
      message: `images/avatars/ must have exactly 12 avatar files (found ${inventory.avatars.length})`,
      context: { got: inventory.avatars.length, expected: 12 },
    });
  }

  // Exactly 12 avataricons
  if (inventory.avataricons.length !== 12) {
    issues.push({
      severity: 'error',
      code: ISSUE_CODES.WRONG_AVATARICON_COUNT,
      category: CATEGORY,
      message: `images/avataricons/ must have exactly 12 avataricon files (found ${inventory.avataricons.length})`,
      context: { got: inventory.avataricons.length, expected: 12 },
    });
  }

  return issues;
}
