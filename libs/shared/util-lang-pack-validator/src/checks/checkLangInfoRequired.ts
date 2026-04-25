/**
 * Langinfo required-items checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — langinfo block.
 *
 * Checks:
 * - Required labels present
 * - Script direction ∈ {LTR, RTL}
 * - Script type ∈ {Roman, Arabic, Devanagari, Khmer, Lao, Thai, Chinese}
 * - Game name length ≤ 30 (warning — Play Store limit)
 * - Ethnologue code matches [a-z]{3}
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'langinfo-required';

const REQUIRED_LABELS = [
  'Lang Name (In Local Lang)',
  'Lang Name (In English)',
  'Ethnologue code',
  'Country',
  'Game Name (In Local Lang)',
  'Script direction (LTR or RTL)',
  'The word NAME in local language',
  'Script type',
  'Email',
  'Privacy Policy',
] as const;

const VALID_SCRIPT_DIRECTIONS = ['LTR', 'RTL'] as const;
const VALID_SCRIPT_TYPES = ['Roman', 'Arabic', 'Devanagari', 'Khmer', 'Lao', 'Thai', 'Chinese'] as const;

export function checkLangInfoRequired(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const { langInfo } = parsed;

  // Check required labels
  for (const label of REQUIRED_LABELS) {
    const value = langInfo.find(label);
    if (value === undefined || value === '') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.MISSING_LANGINFO_LABEL,
        category: CATEGORY,
        file: 'aa_langinfo.txt',
        message: `aa_langinfo.txt is missing required label "${label}"`,
        context: { label },
      });
    }
  }

  // Script direction value
  const scriptDirection = langInfo.find('Script direction (LTR or RTL)');
  if (scriptDirection !== undefined && scriptDirection !== '') {
    if (!(VALID_SCRIPT_DIRECTIONS as readonly string[]).includes(scriptDirection)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_SCRIPT_DIRECTION,
        category: CATEGORY,
        file: 'aa_langinfo.txt',
        message: `Script direction "${scriptDirection}" is invalid — must be LTR or RTL`,
        context: { value: scriptDirection, valid: VALID_SCRIPT_DIRECTIONS },
      });
    }
  }

  // Script type value
  const scriptType = langInfo.find('Script type');
  if (scriptType !== undefined && scriptType !== '') {
    if (!(VALID_SCRIPT_TYPES as readonly string[]).includes(scriptType)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_SCRIPT_TYPE,
        category: CATEGORY,
        file: 'aa_langinfo.txt',
        message: `Script type "${scriptType}" is invalid — must be one of: ${VALID_SCRIPT_TYPES.join(', ')}`,
        context: { value: scriptType, valid: VALID_SCRIPT_TYPES },
      });
    }
  }

  // Game name length ≤ 30 (Play Store limit)
  const gameName = langInfo.find('Game Name (In Local Lang)');
  if (gameName !== undefined && gameName !== '') {
    // Java replaces ' with ꞌ before length check
    const normalized = gameName.replace(/'/g, 'ꞌ');
    if (normalized.length > 30) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.GAME_NAME_TOO_LONG_FOR_PLAY_STORE,
        category: CATEGORY,
        file: 'aa_langinfo.txt',
        message: `Game name "${gameName}" is ${normalized.length} characters, should be ≤30 for Play Store compatibility`,
        context: { gameName, length: normalized.length, limit: 30 },
      });
    }
  }

  // Ethnologue code matches [a-z]{3}
  const ethnologue = langInfo.find('Ethnologue code');
  if (ethnologue !== undefined && ethnologue !== '') {
    if (!/^[a-z]{3}$/.test(ethnologue)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.INVALID_ETHNOLOGUE_CODE,
        category: CATEGORY,
        file: 'aa_langinfo.txt',
        message: `Ethnologue code "${ethnologue}" does not match [a-z]{3} pattern`,
        context: { value: ethnologue },
      });
    }
  }

  return issues;
}
