/**
 * SAD-aware syllable distractor draw, mirrors Colombia.java lines 205-216 / 253-264.
 *
 * If `target.syllable` is in SAD_STRINGS, Java mutates the syllable in place by
 * cloning text from a tile distractor — we MUST clone the row first to avoid
 * aliasing the original parsed array (design.md unresolved Q2).
 *
 * Otherwise: pull a random distractor from `target.distractors` (the
 * SyllableRow.Or1/Or2/Or3 trio); fall back to a random syllable from `pool` if
 * no non-empty distractor exists.
 */
import type { LangAssets } from '@alphaTiles/data-language-assets';

export type SyllableRow = LangAssets['syllables']['rows'][number];
export type TileRow = LangAssets['tiles']['rows'][number];

export function drawSyllableDistractor({
  target,
  pool,
  sadStrings,
  tilesByBase,
  rng = Math.random,
}: {
  target: SyllableRow;
  pool: SyllableRow[];
  sadStrings: ReadonlySet<string>;
  tilesByBase: Map<string, TileRow>;
  rng?: () => number;
}): SyllableRow {
  if (sadStrings.has(target.syllable)) {
    // Clone first to avoid aliasing the parsed array entry.
    const cloned: SyllableRow = {
      ...target,
      distractors: [...target.distractors] as [string, string, string],
    };
    const tileRow = tilesByBase.get(target.syllable);
    if (tileRow) {
      const trio = [tileRow.alt1, tileRow.alt2, tileRow.alt3].filter((s) => !!s);
      if (trio.length > 0) {
        const replacement = trio[Math.floor(rng() * trio.length)];
        cloned.syllable = replacement;
        // Java: if the replacement was already in distractors, swap it for the
        // original syllable text so distractors stays size 3.
        const idxInDistractors = cloned.distractors.indexOf(replacement);
        if (idxInDistractors !== -1) {
          cloned.distractors[idxInDistractors] = target.syllable;
        }
      }
    }
    return cloned;
  }

  const trio = target.distractors.filter((s) => !!s);
  if (trio.length > 0) {
    const replacement = trio[Math.floor(rng() * trio.length)];
    // Synthesize a SyllableRow whose `syllable` is the chosen distractor text.
    // Java's syllableList.returnRandomDistractorSyllable returns the actual
    // SyllableRow for that text if it exists; we look it up.
    const found = pool.find((p) => p.syllable === replacement);
    if (found) return found;
    return { ...target, syllable: replacement };
  }

  // Fallback: random pick from pool, excluding the target.
  const candidates = pool.filter((p) => p.syllable !== target.syllable);
  if (candidates.length === 0) return target;
  return candidates[Math.floor(rng() * candidates.length)];
}
