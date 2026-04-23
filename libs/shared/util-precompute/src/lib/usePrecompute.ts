import { registry } from './precomputeRegistry';
import { usePrecomputeContext } from './PrecomputeProvider';

/**
 * Hook that reads a precomputed value by key from the nearest PrecomputeProvider.
 *
 * Usage (inside a component wrapped by PrecomputeProvider):
 *   const chileData = usePrecompute<ChileData>('chile');
 *
 * Throws if:
 *   - Called outside a PrecomputeProvider
 *   - The key was never registered (likely a typo or missing registerPrecompute call)
 */
export function usePrecompute<T>(key: string): T {
  const cache = usePrecomputeContext();

  if (!cache.has(key)) {
    const registeredKeys = [...registry.keys()].join(', ') || '(none)';
    throw new Error(
      `[util-precompute] No precomputed value for key "${key}". ` +
        `Registered keys: ${registeredKeys}. ` +
        'Ensure registerPrecompute was called before runPrecomputes.',
    );
  }

  return cache.get(key) as T;
}
