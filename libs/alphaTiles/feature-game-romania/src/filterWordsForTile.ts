/**
 * Filter words for a focus tile based on scanSetting (D2 in design.md).
 *
 * scanSetting 1: initial position only
 * scanSetting 2: initial first, then non-initial
 * scanSetting 3: all positions
 *
 * parseWord is injected to avoid importing util-phoneme directly (allows deterministic tests).
 * Generic over W so the caller's narrower word type flows through without widening.
 */
export function filterWordsForTile<W extends { wordInLOP: string; wordInLWC: string; mixedDefs: string }>(
  wordsForTile: readonly W[],
  scanSetting: 1 | 2 | 3,
  focusTileBase: string,
  parseWord: (word: W) => string[],
): W[] {
  if (scanSetting === 3) {
    return [...wordsForTile];
  }
  if (scanSetting === 1) {
    return wordsForTile.filter((w) => parseWord(w)[0] === focusTileBase);
  }
  // scanSetting === 2: initial first, then non-initial
  const initial = wordsForTile.filter((w) => parseWord(w)[0] === focusTileBase);
  const nonInitial = wordsForTile.filter((w) => {
    const tiles = parseWord(w);
    return tiles[0] !== focusTileBase && tiles.includes(focusTileBase);
  });
  return [...initial, ...nonInitial];
}
