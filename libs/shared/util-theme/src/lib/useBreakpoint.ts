/**
 * useBreakpoint — 'phone' | 'tablet' from the current window width.
 *
 * Uses RN's `useWindowDimensions`, which re-renders the caller on rotation or
 * a browser resize (web also runs at desktop widths) without any listener or
 * effect in our code. Supersedes design D5/D6's `Dimensions.get` + `key`
 * workaround.
 */
import { useWindowDimensions } from 'react-native';
import { breakpointForWidth } from './breakpoints';
import type { Breakpoint } from './breakpoints';

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointForWidth(width);
}
