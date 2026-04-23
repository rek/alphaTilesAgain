/**
 * Logical-prop style helpers — positive enforcement of ARCHITECTURE.md §16.
 *
 * Use these instead of raw marginLeft / marginRight / paddingLeft / paddingRight.
 * The custom ESLint rule no-raw-margin-left-right enforces this for all files
 * outside libs/shared/util-theme (negative enforcement).
 *
 * SpacingKey values: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16
 * (gaps at 7, 9, 11, 13, 14, 15 are intentional)
 *
 * Usage:
 *   style.marginStart(4)   → { marginStart: 16 }
 *   style.paddingEnd(2)    → { paddingEnd: 8 }
 *
 * See design.md §D6.
 */
import { spacing } from './spacing';
import type { SpacingKey } from './spacing';

export const style = {
  marginStart: (n: SpacingKey) => ({ marginStart: spacing[n] }),
  marginEnd: (n: SpacingKey) => ({ marginEnd: spacing[n] }),
  paddingStart: (n: SpacingKey) => ({ paddingStart: spacing[n] }),
  paddingEnd: (n: SpacingKey) => ({ paddingEnd: spacing[n] }),
} as const;
