/**
 * Hook that reads a precomputed value by key from LangAssets.precomputes.
 *
 * Moved here from util-precompute per design.md §D7:
 * precomputes are folded into LangAssets (no separate PrecomputeProvider needed).
 * util-precompute re-exports this hook for backwards-compatible import paths.
 *
 * Usage (inside a component wrapped by LangAssetsProvider):
 *   const chileData = usePrecompute<ChileData>('chile');
 *
 * Throws if:
 *   - Called outside LangAssetsProvider
 *   - The key was never registered (likely a typo or missing registerPrecompute call)
 */

import { useLangAssets } from './LangAssetsProvider';

export function usePrecompute<T>(key: string): T {
  const assets = useLangAssets();
  const cache = assets.precomputes;

  if (!cache.has(key)) {
    throw new Error(
      `[util-precompute] No precomputed value for key "${key}". ` +
        'Ensure registerPrecompute was called before the LangAssetsProvider mounted.',
    );
  }

  return cache.get(key) as T;
}
