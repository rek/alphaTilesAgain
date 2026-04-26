/**
 * Evaluate current tile groupings against correct syllable structure.
 *
 * Returns a Set of group indices that are correctly matched (in correct
 * position and content). Only sequential matches from the start count —
 * a group at position i is locked only if all groups 0..i-1 are also locked.
 *
 * Port of Japan.java evaluateCombination() partial-credit logic.
 *
 * TODO(japan-spec-drift): Spec partial-credit walks `currentViews` (interleaved
 * tiles + link-buttons) and credits tiles that sit between any two CONSECUTIVE
 * correct-boundary link-buttons that remain present — joining is NOT required.
 * Java evaluateCombination 484-525 / design D4. Current impl does positional
 * group-by-group string match, which only fires when the player has joined
 * tiles into the exact correct grouping. This rejects the "un-joined but
 * bracketed" credit case in spec scenario "Middle syllable correctly bracketed
 * without joining".
 */

export type TileGroup = {
  tiles: string[];
  isLocked: boolean;
};

/**
 * @param groups - current grouping state
 * @param correctSyllables - expected syllable arrays in order (e.g. [["ba"], ["na","na"]])
 * @returns Set of group indices that are correctly placed
 */
export function evaluateGroupings(
  groups: TileGroup[],
  correctSyllables: string[][],
): Set<number> {
  const locked = new Set<number>();

  // Must match group-by-group in sequence; a mismatch breaks the chain.
  const maxLen = Math.min(groups.length, correctSyllables.length);
  for (let i = 0; i < maxLen; i++) {
    const groupText = groups[i].tiles.join('');
    const syllableText = correctSyllables[i].join('');
    if (groupText === syllableText) {
      locked.add(i);
    } else {
      // Mismatch — remaining groups cannot be evaluated positionally
      break;
    }
  }

  return locked;
}
