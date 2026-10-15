/**
 * S-mode prompt: the word with its first syllable blanked (e.g. 醫生 → "__生").
 * Shown under the picture before the correct tap so the learner sees the
 * task is "which syllable starts this word?" (issue #30). Single-syllable
 * words render as the placeholder alone. Tile mode never calls this.
 * Placeholder matches Brazil's default blank (`__`).
 */
const PLACEHOLDER = '__';

export function buildSyllableHint({ syllables }: { syllables: string[] }) {
  if (syllables.length === 0) return '';
  return PLACEHOLDER + syllables.slice(1).join('');
}
