/**
 * Naive longest-match syllable parser.
 *
 * Java reference: SyllableList.parseWordIntoSyllables (Start.java) — used by
 * Georgia.java ~174 to produce `parsedRefWordSyllableArray`.
 *
 * Greedy longest-prefix match against the syllable list (sorted by descending
 * length). Returns [] if the word can't be fully parsed; caller retries with
 * another word.
 *
 * Generic over the row type so this util has no dependency on the alphaTiles
 * data layer (util→nothing dep rule). Caller passes any objects with a
 * `syllable: string` field; the full row type is preserved in the return.
 */

export function parseWordIntoSyllables<T extends { syllable: string }>(
  wordInLOP: string,
  syllables: T[],
): T[] {
  if (syllables.length === 0) return [];
  const sorted = [...syllables].sort(
    (a, b) => b.syllable.length - a.syllable.length,
  );
  const lop = wordInLOP.replace(/[#.]/g, '');
  const result: T[] = [];
  let i = 0;
  while (i < lop.length) {
    let matched: T | undefined;
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
