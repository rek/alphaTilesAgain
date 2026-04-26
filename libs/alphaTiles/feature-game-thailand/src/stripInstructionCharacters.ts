/**
 * Strip syllable/tile-break instruction characters from a wordInLOP.
 *
 * Port of `Start.WordList.stripInstructionCharacters` (Java):
 *   - "." = syllable break (e.g. "sun.burn")
 *   - "#" = intra-syllable tile break (Mixtec disambiguation, e.g. "k#uun")
 */
export function stripInstructionCharacters(wordInLOP: string): string {
  return wordInLOP.replace(/[.#]/g, '');
}
