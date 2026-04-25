/**
 * Keyboard coherence checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — keyboard + wordlist block.
 *
 * Checks:
 * - Every character in a word's LOP column (minus '.' and '#') is a keyboard key or substring of one
 * - Unicode hex in error messages for non-printable chars (matches Java U+XXXX format)
 * - Key-usage count: flag keys used in < NUM_TIMES_KEYS_WANTED_IN_WORDS (5) words
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'keyboard-coherence';
// Java constant: NUM_TIMES_KEYS_WANTED_IN_WORDS = 5
const NUM_TIMES_KEYS_WANTED = 5;

export function checkKeyboardCoherence(parsed: ParsedPack): Issue[] {
  const issues: Issue[] = [];
  const { keys, words } = parsed;

  if (keys.rows.length === 0) return issues;

  // Build key usage map
  const keyUsage = new Map<string, number>();
  for (const row of keys.rows) {
    keyUsage.set(row.key, 0);
  }

  // Check each word's LOP characters are keyboard keys or substrings of keys
  for (let i = 0; i < words.rows.length; i++) {
    const row = words.rows[i];
    const lineNumber = i + 2;
    // Strip syllable separators and tone markers before checking
    const lopStripped = row.wordInLOP.replace(/[.#]/g, '');

    for (let ci = 0; ci < lopStripped.length; ci++) {
      const ch = lopStripped[ci];
      if (keyUsage.has(ch)) {
        continue; // Direct key match
      }
      // Check if the char appears as part of any longer key string (e.g. 'c' in 'ch')
      let charIsPartOfLongerKey = false;
      for (const [keyStr] of keyUsage) {
        if (keyStr.includes(ch)) {
          charIsPartOfLongerKey = true;
          break;
        }
      }
      if (!charIsPartOfLongerKey) {
        const hex = (ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0');
        const unicodeStr = `(U+${hex})`;
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.WORD_CHAR_NOT_IN_KEYBOARD,
          category: CATEGORY,
          file: 'aa_wordlist.txt',
          line: lineNumber,
          message: `Word "${lopStripped}" contains character "${ch}" ${unicodeStr} which is not in the keyboard`,
          context: { word: lopStripped, char: ch, unicode: `U+${hex}` },
        });
      }
    }
  }

  // Count key usage across wordlist (Java: count words containing the key)
  for (const row of words.rows) {
    const lop = row.wordInLOP.replace(/\./g, '');
    for (const [keyStr] of keyUsage) {
      if (lop.includes(keyStr)) {
        keyUsage.set(keyStr, (keyUsage.get(keyStr) ?? 0) + 1);
      }
    }
  }

  // Flag underused keys
  for (const [keyStr, count] of keyUsage) {
    if (count < NUM_TIMES_KEYS_WANTED) {
      const hex = keyStr.length > 0
        ? (keyStr.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')
        : '';
      const unicodeStr = hex ? ` (U+${hex})` : '';
      issues.push({
        severity: 'info',
        code: ISSUE_CODES.KEY_UNDERUSED,
        category: CATEGORY,
        file: 'aa_keyboard.txt',
        message: `Key "${keyStr}"${unicodeStr} is only used in ${count} word(s) — recommended minimum is ${NUM_TIMES_KEYS_WANTED}`,
        context: { key: keyStr, count, minimum: NUM_TIMES_KEYS_WANTED },
      });
    }
  }

  return issues;
}
