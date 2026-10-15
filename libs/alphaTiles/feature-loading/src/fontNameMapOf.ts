/**
 * Font-family names for ThemeProvider. A pack without fonts/ → no names
 * (system font). A font that failed to load → no names either, so no screen
 * asks for a family that was never registered (C9).
 */
export function fontNameMapOf({
  fonts,
  failed,
}: {
  fonts: { primary?: unknown; primaryBold?: unknown };
  failed: boolean;
}): { primary?: string; primaryBold?: string } {
  if (failed) return {};
  return {
    primary: fonts.primary != null ? 'primary' : undefined,
    primaryBold: fonts.primaryBold != null ? 'primaryBold' : undefined,
  };
}
