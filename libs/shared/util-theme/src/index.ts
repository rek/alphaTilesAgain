// Public API — import from '@shared/util-theme'
// Internal constants (typography, spacing) are not part of the public API;
// consumers obtain tokens via useTheme().

export { buildTheme } from './lib/buildTheme';
export type { Theme, FontMap } from './lib/buildTheme';

export { ThemeProvider } from './lib/ThemeProvider';
export { useTheme } from './lib/useTheme';
export { useFontsReady } from './lib/useFontsReady';

export { style } from './lib/style';
export { readableTextColor } from './lib/readableTextColor';
export { readableAccentColor } from './lib/readableAccentColor';
export { contrastRatio } from './lib/contrastRatio';
export type { SpacingKey } from './lib/spacing';

export { TABLET_MIN_WIDTH, breakpointForWidth } from './lib/breakpoints';
export type { Breakpoint } from './lib/breakpoints';
export { useBreakpoint } from './lib/useBreakpoint';

// Testing sub-path exports — available via direct import in test/storybook files.
// Not re-exported here to keep the public runtime bundle clean.
