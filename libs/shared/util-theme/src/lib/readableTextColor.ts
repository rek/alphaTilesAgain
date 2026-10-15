import { contrastRatio } from './contrastRatio';

const DARK = '#000000';
const LIGHT = '#FFFFFF';
/** WCAG 2.x AA for large text (≥ 18.66px bold) — tile / badge / door labels are large bold glyphs. */
export const AA_LARGE_TEXT = 3;

/**
 * Text colour for a label drawn ON a pack colour (tile, door, badge).
 *
 * Keeps AlphaTiles' white-on-colour look wherever white reaches WCAG AA
 * large-text contrast (3:1), else black. Fixed white failed on the yellow /
 * green tiles (white on #FFFF00 ≈ 1.07:1). Unparseable input → black.
 */
export function readableTextColor(bgHex: string | undefined) {
  return contrastRatio(bgHex, LIGHT) >= AA_LARGE_TEXT ? LIGHT : DARK;
}
