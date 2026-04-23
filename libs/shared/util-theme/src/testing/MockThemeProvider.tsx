/**
 * Mock ThemeProvider for unit tests and Storybook stories.
 * Uses a static English-default theme so consumers don't need a real lang pack.
 *
 * Usage (jest):
 *   render(<MockThemeProvider><MyComponent /></MockThemeProvider>)
 *
 * Usage (Storybook):
 *   export const decorators = [withMockTheme];
 *
 * See design.md §D4.
 */
import React from 'react';
import { ThemeProvider } from '../lib/ThemeProvider';

/** 13-entry palette matching engEnglish4/res/raw/aa_colors.txt */
export const MOCK_PALETTE: readonly string[] = [
  '#9C27B0', // 0 themePurple
  '#2196F3', // 1 themeBlue
  '#F44336', // 2 themeOrange
  '#4CAF50', // 3 themeGreen
  '#E91E63', // 4 themeRed
  '#FFFF00', // 5 yellow
  '#000000', // 6 black
  '#006600', // 7 dark green
  '#808080', // 8 gray
  '#663300', // 9 brown
  '#FF0000', // 10 red
  '#A50021', // 11 magenta
  '#0000CC', // 12 blue
] as const;

export const MOCK_FONT_MAP = {
  primary: 'andikanewbasic_r',
  primaryBold: 'andikanewbasic_b',
} as const;

type Props = { children: React.ReactNode };

export function MockThemeProvider({ children }: Props): React.JSX.Element {
  return (
    <ThemeProvider palette={MOCK_PALETTE} fontMap={MOCK_FONT_MAP}>
      {children}
    </ThemeProvider>
  );
}
