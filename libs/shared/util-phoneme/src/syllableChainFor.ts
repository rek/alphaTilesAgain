import { parseWordIntoSyllables } from './parseWordIntoSyllables';

/**
 * The syllables a word is spoken as when it has no recording of its own
 * (yue composite numerals: 二十 → 二 + 十). Empty when the LOP doesn't fully
 * parse or any part lacks a clip — the word is then unspeakable.
 *
 * Single source of the "decomposable" rule: the pack binder tolerates a
 * missing word clip iff this is non-empty, the validator downgrades
 * MISSING_WORD_AUDIO on the same test, and pack speech plays exactly these
 * syllables. Callers differ only in how they answer `hasClip`.
 */
export function syllableChainFor<T extends { syllable: string }>(
  wordInLOP: string,
  syllables: T[],
  hasClip: (syllable: T) => boolean,
): T[] {
  if (!wordInLOP) return [];
  const parts = parseWordIntoSyllables(wordInLOP, syllables);
  return parts.every(hasClip) ? parts : [];
}
