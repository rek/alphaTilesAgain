/**
 * Pure function: assembles a Theme object from parsed pack data.
 * No hooks, no side effects — safe to call in tests without React providers.
 *
 * palette — hexByIndex array from parseColors (index-stable per aa_colors.txt)
 * fontMap — { primary, primaryBold? } font names from langManifest.fonts
 * fontScale — pack "Font Scale" (parsed/clamped via parseFontScale)
 *
 * See design.md §D1, §D2, §D3, §D4.
 */
import { buildTypography } from './typography';
import { spacing } from './spacing';
import { DEFAULT_FONT_SCALE } from './fontScale';

// primary undefined → system font (pack ships no fonts/).
export type FontMap = {
  primary?: string;
  primaryBold?: string;
};

export function buildTheme(
  palette: readonly string[],
  fontMap: FontMap,
  fontScale: number = DEFAULT_FONT_SCALE,
) {
  return {
    /**
     * Full integer-indexed palette from aa_colors.txt.
     * Tile and game color columns reference entries by integer index.
     */
    palette,
    colors: {
      /** palette[0] — themePurple by aa_colors.txt convention */
      primary: palette[0] ?? '#000000',
      /** palette[0] — same as primary; theme background color */
      background: palette[0] ?? '#000000',
      /** Hardcoded — no pack has ever varied black text */
      text: '#000000' as const,
    },
    /** 6-slot ladder × fontScale. */
    typography: buildTypography(fontScale),
    /** Pack "Font Scale"; multiplier for off-ladder literal sizes. */
    fontScale,
    spacing,
    fontFamily: {
      primary: fontMap.primary,
      /** Falls back to primary when pack omits a bold variant */
      primaryBold: fontMap.primaryBold ?? fontMap.primary,
    },
  } as const;
}

export type Theme = ReturnType<typeof buildTheme>;
