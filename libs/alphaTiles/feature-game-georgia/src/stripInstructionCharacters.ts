/**
 * Strip syllable/tile-break instruction characters from a wordInLOP.
 *
 * Port of `Start.WordList.stripInstructionCharacters` (Java) — used by
 * Georgia.java ~414 to populate `fullWordTextView` on a correct answer.
 */
export function stripInstructionCharacters(wordInLOP: string): string {
  return wordInLOP.replace(/[.#]/g, '');
}
