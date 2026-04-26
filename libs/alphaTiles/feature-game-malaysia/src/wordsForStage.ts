/**
 * Pick the active stage's word list, with the same ratchet Java uses
 * (`Malaysia.java` reads `wordStagesLists.get(stage - 1)`; the surrounding
 * GameActivity contract guarantees `stage` is in [1..wordStagesLists.length]).
 *
 * Defensive behavior:
 * - If `stage` is out of range we clamp into [1..wordStagesLists.length].
 * - If the chosen stage bucket is empty we fall back to the previous
 *   non-empty stage, walking down to stage 1, mirroring the ratchet used in
 *   `selectWordForStage` (`util-stages/src/lib/selectWordForStage.ts:36`).
 * - If every stage is empty we return [].
 */
export function wordsForStage<W>(
  wordStagesLists: ReadonlyArray<ReadonlyArray<W>>,
  stage: number,
): W[] {
  if (wordStagesLists.length === 0) return [];

  let s = Math.max(1, Math.min(wordStagesLists.length, Math.floor(stage)));
  while (s > 1 && wordStagesLists[s - 1].length === 0) {
    s--;
  }
  return [...wordStagesLists[s - 1]];
}
