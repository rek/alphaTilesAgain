/**
 * Ecuador.java ~320–329: tile background colors cycle through 5 entries
 * (`colors.hexByIndex[i % 5]`). Tile text color is white.
 */

const PALETTE_FALLBACK = ['#1565C0', '#43A047', '#E53935', '#FB8C00', '#8E24AA'];

export function tileColor(index: number, palette: ReadonlyArray<string>): string {
  const source = palette.length >= 5 ? palette : PALETTE_FALLBACK;
  return source[index % 5];
}
