/**
 * Pure function: assembles a Theme object from parsed pack data.
 * No hooks, no side effects — safe to call in tests without React providers.
 *
 * palette — hexByIndex array from parseColors (index-stable per aa_colors.txt)
 * fontMap — { primary, primaryBold? } font names from langManifest.fonts
 *
 * See design.md §D1, §D2, §D3, §D4.
 */
import { typography } from './typography';
import { spacing } from './spacing';

export type FontMap = {
  primary: string;
  primaryBold?: string;
};

export function buildTheme(palette: readonly string[], fontMap: FontMap) {
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
    typography,
    spacing,
    fontFamily: {
      primary: fontMap.primary,
      /** Falls back to primary when pack omits a bold variant */
      primaryBold: fontMap.primaryBold ?? fontMap.primary,
    },
  } as const;
}

export type Theme = ReturnType<typeof buildTheme>;
