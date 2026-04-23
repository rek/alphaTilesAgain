/**
 * Settings type checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — settings-cast block.
 *
 * Checks:
 * - Boolean settings have TRUE/FALSE (case-insensitive) values
 * - Integer settings parse as int
 * - Stage correspondence ratio in [0.1, 1] (Java check: < 0.1 or > 1 is error)
 * - Unknown setting keys → info (not error; settings file may evolve)
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'settings-types';

// Java reference: Validator.java validates each of these explicitly
const BOOLEAN_SETTINGS = [
  'Has tile audio',
  'Has syllable audio',
  'First letter stage correspondence',
  'Differentiates types of multitype symbols',
  'Show filter options for Game 001',
  'In Game 001 (Romania) bold non-initial tiles when in focus? (boldNonInitialFocusTiles)',
  'In Game 001 (Romania) bold initial tiles when in focus? (boldInitialFocusTiles)',
] as const;

const INT_SETTINGS = [
  'After 12 checked trackers',
  'Number of avatars',
  'Stage 1-2 max word length',
  'Days until expiration',
  'Chile keyboard width',
  'Chile base guess count',
  'Chile minimum word length',
  'Chile maximum word length',
] as const;

const KNOWN_KEYS = new Set<string>([
  ...BOOLEAN_SETTINGS,
  ...INT_SETTINGS,
  'Stage correspondence ratio',
  'Stand-in base for combining tiles',
]);

function isBooleanValue(val: string): boolean {
  return /^(true|false)$/i.test(val);
}

export function checkSettingsTypes(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const { settings } = parsed;

  // Boolean settings
  for (const key of BOOLEAN_SETTINGS) {
    const val = settings.find(key);
    if (val === undefined || val === '') continue; // missing is handled by langinfo check
    if (!isBooleanValue(val)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_BOOLEAN_SETTING,
        category: CATEGORY,
        file: 'aa_settings.txt',
        message: `Setting "${key}" has value "${val}" — expected TRUE or FALSE`,
        context: { key, value: val },
      });
    }
  }

  // Integer settings
  for (const key of INT_SETTINGS) {
    const val = settings.find(key);
    if (val === undefined || val === '') continue;
    if (isNaN(parseInt(val, 10)) || !/^-?\d+$/.test(val.trim())) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_INT_SETTING,
        category: CATEGORY,
        file: 'aa_settings.txt',
        message: `Setting "${key}" has value "${val}" — expected an integer`,
        context: { key, value: val },
      });
    }
  }

  // Stage correspondence ratio
  const scrVal = settings.find('Stage correspondence ratio');
  if (scrVal !== undefined && scrVal !== '') {
    // Java: must match -?\d+(\.\d+)? pattern AND be in [0.1, 1]
    if (!/^-?\d+(\.\d+)?$/.test(scrVal.trim())) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.RATIO_OUT_OF_RANGE,
        category: CATEGORY,
        file: 'aa_settings.txt',
        message: `Stage correspondence ratio "${scrVal}" must be a decimal number (e.g. 0.75)`,
        context: { value: scrVal },
      });
    } else {
      const n = parseFloat(scrVal);
      if (n < 0.1 || n > 1) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.RATIO_OUT_OF_RANGE,
          category: CATEGORY,
          file: 'aa_settings.txt',
          message: `Stage correspondence ratio "${scrVal}" must be between 0.1 and 1`,
          context: { value: scrVal, parsed: n },
        });
      }
      // Java check: ratio === 1 causes game crash
      if (n === 1) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.STAGE_CORRESPONDENCE_RATIO_IS_ONE,
          category: CATEGORY,
          file: 'aa_settings.txt',
          message: 'Stage correspondence ratio of 1 will cause app games to crash — set to 0.75 instead',
          context: { value: scrVal },
        });
      }
    }
  }

  // Unknown setting keys
  for (const entry of settings.entries) {
    const rawLabel = entry.label;
    // Normalize: strip numeric prefix
    const normalized = rawLabel.replace(/^\d+\.\s*/, '').trim();
    if (!KNOWN_KEYS.has(normalized)) {
      issues.push({
        severity: 'info',
        code: ISSUE_CODES.UNKNOWN_SETTING_KEY,
        category: CATEGORY,
        file: 'aa_settings.txt',
        message: `Unknown setting key "${rawLabel}" — not recognized by the validator (may be a new or custom setting)`,
        context: { key: rawLabel },
      });
    }
  }

  return issues;
}
