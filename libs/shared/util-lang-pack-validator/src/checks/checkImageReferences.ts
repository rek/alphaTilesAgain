/**
 * Image reference checks.
 *
 * Java reference: Validator.java#checkImagePresence + validateResourceSubfolders.
 *
 * Checks:
 * - Every word LWC has images/words/<lwc>.png
 * - Optional: <lwc>2.png distractor variant (no error if missing)
 * - Orphan pngs (files not referenced) → warning
 * - Typo hints via Levenshtein for missing images
 */

import type { Issue } from '../Issue';
import type { ParsedPack } from '@shared/util-lang-pack-parser';
import type { FileInventory } from '../FileInventory';
import { ISSUE_CODES } from '../issueCodes';
import { wordDistance } from '../levenshtein';

const CATEGORY = 'image-reference';
const MAX_LEVENSHTEIN_RATIO = 0.4;

function findTypoSuggestion(missing: string, candidates: string[]): string | null {
  if (missing.length === 0) return null;
  let minError = MAX_LEVENSHTEIN_RATIO;
  let closest: string | null = null;
  for (const candidate of candidates) {
    const dist = wordDistance(candidate, missing);
    const ratio = dist / missing.length;
    if (ratio < minError) {
      minError = ratio;
      closest = candidate;
    }
  }
  return closest;
}

export function checkImageReferences(
  parsed: ParsedPack,
  inventory: FileInventory,
): Issue[] {
  const issues: Issue[] = [];
  const { words } = parsed;

  const referencedImages = new Set<string>();

  for (let i = 0; i < words.rows.length; i++) {
    const row = words.rows[i];
    const lineNumber = i + 2;
    const lwc = row.wordInLWC;
    referencedImages.add(lwc);

    if (!inventory.wordImages.includes(lwc)) {
      const suggestion = findTypoSuggestion(lwc, inventory.wordImages);
      issues.push({
        severity: 'error',
        code: ISSUE_CODES.MISSING_WORD_IMAGE,
        category: CATEGORY,
        file: 'aa_wordlist.txt',
        line: lineNumber,
        column: 'wordInLWC',
        message: `Word "${lwc}" is missing image images/words/${lwc}.png${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`,
        context: { word: lwc, suggestion },
      });
      if (suggestion) {
        issues.push({
          severity: 'info',
          code: ISSUE_CODES.IMAGE_TYPO_SUGGESTION,
          category: CATEGORY,
          file: 'aa_wordlist.txt',
          line: lineNumber,
          message: `Image "${lwc}.png" is missing but "${suggestion}.png" exists and is similar — did you make a typo?`,
          context: { missing: lwc, suggestion },
        });
      }
    }
    // distractor variant <lwc>2.png is optional — no error
  }

  // Orphan images — in inventory but not referenced (also '2' variants are OK to exist)
  for (const f of inventory.wordImages) {
    // Strip trailing '2' distractor marker for matching
    const baseName = f.endsWith('2') ? f.slice(0, -1) : f;
    if (!referencedImages.has(baseName)) {
      issues.push({
        severity: 'warning',
        code: ISSUE_CODES.ORPHAN_IMAGE_FILE,
        category: CATEGORY,
        message: `images/words/${f}.png exists but "${baseName}" is not referenced in aa_wordlist.txt`,
        context: { file: f, baseName },
      });
    }
  }

  return issues;
}
