/**
 * Naive longest-match syllable parser.
 *
 * Java reference: SyllableList.parseWordIntoSyllables (Start.java) — used by
 * Georgia.java ~174 to produce `parsedRefWordSyllableArray`.
 *
 * Greedy longest-prefix match against the syllable list (sorted by descending
 * length). Returns [] if the word can't be fully parsed; caller retries with
 * another word.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

type SyllableRow = LangAssets['syllables']['rows'][number];

export function parseWordIntoSyllables(
  wordInLOP: string,
  syllables: SyllableRow[],
): SyllableRow[] {
  if (syllables.length === 0) return [];
  const sorted = [...syllables].sort(
    (a, b) => b.syllable.length - a.syllable.length,
  );
  const lop = wordInLOP.replace(/[#.]/g, '');
  const result: SyllableRow[] = [];
  let i = 0;
  while (i < lop.length) {
    let matched: SyllableRow | undefined;
    for (const s of sorted) {
      if (s.syllable.length > 0 && lop.startsWith(s.syllable, i)) {
        matched = s;
        break;
      }
    }
    if (!matched) return [];
    result.push(matched);
    i += matched.syllable.length;
  }
  return result;
}
