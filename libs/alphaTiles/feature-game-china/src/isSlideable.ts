/**
 * Port of China.java:348–373 isSlideable.
 * Tile at `index` is slideable iff a 4-connected neighbor equals `blankIndex`.
 * Row boundaries are enforced to prevent wrap-around between rows.
 */
export function isSlideable(index: number, blankIndex: number, columns = 4): boolean {
  const totalRows = 4;
  // Left neighbor — only when not in leftmost column
  if (index % columns !== 0 && index - 1 === blankIndex) return true;
  // Right neighbor — only when not in rightmost column
  if ((index + 1) % columns !== 0 && index + 1 === blankIndex) return true;
  // Up neighbor
  if (index >= columns && index - columns === blankIndex) return true;
  // Down neighbor
  if (index < columns * (totalRows - 1) && index + columns === blankIndex) return true;
  return false;
}
