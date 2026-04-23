import { useEffect } from 'react';
import { screen } from './screen';

/**
 * Hook for containers to fire a screen-view event on mount.
 *
 * Usage in a container:
 *   useTrackScreenMount('/choose-player');
 *
 * Calls `screen(name)` exactly once after the component mounts.
 * Uses `useEffect` with an empty deps array — this is the `useMountEffect`
 * pattern (one-time setup); no external state is synced.
 *
 * Note: direct `useEffect` is permitted here because this is the canonical
 * one-time mount pattern from CODE_STYLE.md §Hooks. The broader prohibition
 * targets state-sync effects, not intentional one-shot side effects.
 */
export function useTrackScreenMount(name: string): void {
  useEffect(() => {
    screen(name);
  }, []); // empty deps: fire once on mount
}
