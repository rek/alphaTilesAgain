/**
 * Layout breakpoints — single source of truth (tablet-layout D2).
 * Callers import the constant rather than repeating magic numbers.
 */

/** Window width (dp) at or above which layouts use the tablet treatment. */
export const TABLET_MIN_WIDTH = 768;

export type Breakpoint = 'phone' | 'tablet';

/** Pure width → breakpoint mapping; `useBreakpoint()` feeds it the window width. */
export function breakpointForWidth(width: number): Breakpoint {
  return width >= TABLET_MIN_WIDTH ? 'tablet' : 'phone';
}
