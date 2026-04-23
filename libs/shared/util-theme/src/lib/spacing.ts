/**
 * Spacing scale in 4pt units. Keys are integers; values are pixels.
 * Gaps at 7, 9, 11, 13, 14, 15 are intentional — forces call sites into a
 * small allowed set. Call site: spacing[4] === 16.
 *
 * See design.md §D3.
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
