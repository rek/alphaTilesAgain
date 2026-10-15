import { useEffect } from 'react';

/**
 * Run `effect` once on mount; its returned cleanup runs on unmount.
 *
 * The one sanctioned wrapper for one-shot setup/teardown (timers,
 * subscriptions, a mount-time action) — see CODE_STYLE "useEffect Rules".
 * `effect` is read only on mount: later renders' closures are ignored, so read
 * changing values through refs or setters.
 */
export function useMountEffect(effect: () => void | (() => void)): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
