import { contrastRatio } from './contrastRatio';
import { AA_LARGE_TEXT } from './readableTextColor';

const FALLBACK = '#1F2937';

/**
 * A pack colour used AS text / icon colour on a light surface (outlined menu
 * door, Lotería card). Returns `colorHex` when it reaches AA large-text
 * contrast on `surfaceHex`, else a near-black fallback (yellow on white ≈ 1.07:1).
 */
export function readableAccentColor(colorHex: string | undefined, surfaceHex = '#FFFFFF') {
  return colorHex && contrastRatio(colorHex, surfaceHex) >= AA_LARGE_TEXT ? colorHex : FALLBACK;
}
