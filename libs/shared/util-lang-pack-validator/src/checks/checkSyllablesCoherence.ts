/**
 * Syllables coherence checks.
 *
 * Java reference: Validator.java#validateGoogleSheet — syllables block.
 *
 * Only active when ≥6 words' LOP column contains '.' (Java: decideIfSyllablesAttempted).
 *
 * When active:
 * - Every syllable referenced in word LOPs (parts split by '.') exists in aa_syllables.txt
 * - Every syllable in aa_syllables.txt is referenced by at least one word
 * - Every syllable has an audio file (if syllableAudio inventory is provided)
 * - Distractor validation for syllables
 *
 * When inactive:
 * - Emit info SYLLABLES_SKIPPED (transparency)
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { FileInventory } from '../FileInventory';
import { ISSUE_CODES } from '../issueCodes';

const CATEGORY = 'syllables-coherence';
const SYLLABLE_THRESHOLD = 6;

/**
 * Returns true iff ≥6 words have a '.' in their LOP column.
 * Port of Java decideIfSyllablesAttempted.
 */
export function shouldCheckSyllables(parsed: ParsedPack): boolean {
  let count = 0;
  for (const word of parsed.words.rows) {
    if (word.wordInLOP.includes('.')) {
      count++;
      if (count >= SYLLABLE_THRESHOLD) return true;
    }
  }
  return false;
}

export function checkSyllablesCoherence(
  parsed: ParsedPack,
  inventory: FileInventory,
): Issue[] {
  const issues: Issue[] = [];
  const { words, syllables } = parsed;

  if (!shouldCheckSyllables(parsed)) {
    issues.push({
      severity: 'info',
      code: ISSUE_CODES.SYLLABLES_SKIPPED,
      category: CATEGORY,
      message: `Syllable check skipped — fewer than ${SYLLABLE_THRESHOLD} words use '.' syllable markers in LOP`,
      context: { threshold: SYLLABLE_THRESHOLD },
    });
    return issues;
  }

  // Build lookup set of known syllables
  const knownSyllables = new Set(syllables.rows.map((r) => r.syllable));
  const usedSyllables = new Set<string>();

  // Check each word's syllable references
  for (let i = 0; i < words.rows.length; i++) {
    const word = words.rows[i];
    if (!word.wordInLOP.includes('.')) continue;

    const syllableParts = word.wordInLOP.split('.');
    const lineNumber = i + 2;

    for (const syllablePart of syllableParts) {
      const s = syllablePart.trim();
      if (s === '' || s === '#') continue; // tone markers / separators — skip
      usedSyllables.add(s);

      if (!knownSyllables.has(s)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.UNKNOWN_SYLLABLE_REFERENCE,
          category: CATEGORY,
          file: 'aa_wordlist.txt',
          line: lineNumber,
          message: `Word "${word.wordInLWC}" references syllable "${s}" which does not exist in aa_syllables.txt`,
          context: { word: word.wordInLWC, syllable: s },
        });
      }
    }
  }

  // Check each syllable is used in at least one word
  for (let i = 0; i < syllables.rows.length; i++) {
    const syllable = syllables.rows[i];
    if (!usedSyllables.has(syllable.syllable)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.SYLLABLE_NOT_USED_IN_WORDLIST,
        category: CATEGORY,
        file: 'aa_syllables.txt',
        line: i + 2,
        message: `Syllable "${syllable.syllable}" is defined but not referenced by any word in aa_wordlist.txt`,
        context: { syllable: syllable.syllable },
      });
    }
  }

  // Distractor checks: distractors must be in the syllable list
  for (let i = 0; i < syllables.rows.length; i++) {
    const syllable = syllables.rows[i];
    const lineNumber = i + 2;

    // Self-duplicate distractor check
    const allVariants = [syllable.syllable, ...syllable.distractors].filter((v) => v !== '');
    const uniqueVariants = new Set(allVariants);
    if (uniqueVariants.size < allVariants.length) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.SYLLABLE_SELF_DUPLICATE_DISTRACTOR,
        category: CATEGORY,
        file: 'aa_syllables.txt',
        line: lineNumber,
        message: `Syllable "${syllable.syllable}" has duplicate values among (syllable, Or1, Or2, Or3)`,
        context: { syllable: syllable.syllable, distractors: syllable.distractors },
      });
    }

    // Each non-empty distractor must reference a known syllable
    for (const distractor of syllable.distractors) {
      if (distractor === '' || distractor === syllable.syllable) continue;
      if (!knownSyllables.has(distractor)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.SYLLABLE_INVALID_DISTRACTOR,
          category: CATEGORY,
          file: 'aa_syllables.txt',
          line: lineNumber,
          message: `Syllable "${syllable.syllable}" has distractor "${distractor}" which does not exist in aa_syllables.txt`,
          context: { syllable: syllable.syllable, distractor },
        });
      }
    }
  }

  // Audio checks — only if inventory has syllable audio info
  if (inventory.syllableAudio.length > 0 || syllables.rows.length > 0) {
    const syllableAudioSet = new Set(inventory.syllableAudio);

    for (let i = 0; i < syllables.rows.length; i++) {
      const syllable = syllables.rows[i];
      if (syllable.audioName === '' || syllable.audioName === 'zz_no_audio_needed') continue;

      if (!syllableAudioSet.has(syllable.audioName)) {
        issues.push({
          severity: 'error',
          code: ISSUE_CODES.MISSING_SYLLABLE_AUDIO,
          category: CATEGORY,
          file: 'aa_syllables.txt',
          line: i + 2,
          message: `Syllable "${syllable.syllable}" audio "${syllable.audioName}" not found in audio/syllables/`,
          context: { syllable: syllable.syllable, audioName: syllable.audioName },
        });
      }
    }
  }

  return issues;
}
