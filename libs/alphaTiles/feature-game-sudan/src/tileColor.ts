/**
 * Map a tile's `typeOfThisTileInstance` to its background color index.
 *
 * Mirrors `Sudan.java showCorrectNumTiles` switch verbatim:
 *   case "C": colorList[1]
 *   case "V": colorList[2]
 *   case "T": colorList[3]
 *   default:  colorList[4]   (LV, AV, BV, FV, AD, D, PC, X, etc. all fall through)
 *
 * Java does NOT case-fold vowel sub-types — preserved per "match Java" directive.
 */
export function tileColor(
  typeOfThisTileInstance: string,
  colorList: readonly string[],
): string {
  switch (typeOfThisTileInstance) {
    case 'C':
      return colorList[1];
    case 'V':
      return colorList[2];
    case 'T':
      return colorList[3];
    default:
      return colorList[4];
  }
}
