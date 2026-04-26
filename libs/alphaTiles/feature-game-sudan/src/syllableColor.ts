/**
 * Resolve a syllable's background color from its own numeric-string `color` field.
 *
 * Mirrors `Sudan.java showCorrectNumSyllables`:
 *   String color = syllablePagesLists.get(page).get(i).color;
 *   String typeColor = colorList.get(Integer.parseInt(color));
 *
 * Returns `colorList[Number(syl.color)]`. NaN / out-of-range yields undefined,
 * letting callers fall back to a default color.
 */
export function syllableColor(
  rawColor: string,
  colorList: readonly string[],
): string | undefined {
  const idx = Number(rawColor);
  if (!Number.isFinite(idx)) return undefined;
  return colorList[idx];
}
