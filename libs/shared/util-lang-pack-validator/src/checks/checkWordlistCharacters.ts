/**
 * Wordlist character checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — wordlist column checks.
 *
 * Checks:
 * - LWC column (col 0) matches [a-z0-9_]+
 * - LOP column (col 1) is non-empty
 * - Words with spaces: >5% → warning, some but ≤5% → info recommendation
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'wordlist-characters';

export function checkWordlistCharacters(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const { words } = parsed;

  if (words.rows.length === 0) return issues;

  let wordsWithSpaces = 0;

  for (let i = 0; i < words.rows.length; i++) {
    const row = words.rows[i];
    const lineNumber = i + 2;

    // LWC must match [a-z0-9_]+
    if (!row.wordInLWC.match(/^[a-z0-9_]+$/)) {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.INVALID_WORDLIST_LWC_CHARS,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        column: 'wordInLWC',
        message: `Word LWC "${row.wordInLWC}" contains non-alphanumeric characters (allowed: a-z, 0-9, _)`,
        context: { word: row.wordInLWC },
      });
    }

    // LOP must be non-empty
    if (!row.wordInLOP || row.wordInLOP.trim() === '') {
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.EMPTY_LOP_VALUE,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        column: 'wordInLOP',
        message: `Word at row ${lineNumber} has an empty LOP (Language-of-Play) value`,
        context: { wordInLWC: row.wordInLWC },
      });
    }

    if (row.wordInLOP.includes(' ')) {
      wordsWithSpaces++;
    }
  }

  // Spaces analysis
  if (wordsWithSpaces > 0) {
    const ratio = wordsWithSpaces / words.rows.length;
    if (ratio >= 0.05) {
      // Java: more than 5% of words have spaces
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.MANY_WORDS_HAVE_SPACES,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        message: `${wordsWithSpaces} of ${words.rows.length} words (${(ratio * 100).toFixed(1)}%) contain spaces — consider removing them`,
        context: { count: wordsWithSpaces, total: words.rows.length, ratio },
      });
    } else {
      // Java: < 5% → recommendation
      issues.push({
        severity: 'info',
        code: ISSUE_CODES.FEW_WORDS_HAVE_SPACES,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        message: `${wordsWithSpaces} word(s) contain spaces (< 5% of wordlist) — consider removing those with spaces`,
        context: { count: wordsWithSpaces, total: words.rows.length, ratio },
      });
    }
  }

  return issues;
}
