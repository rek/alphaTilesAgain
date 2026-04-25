import { registry } from './precomputeRegistry';
import type { PrecomputeFn } from './precomputeRegistry';

/**
 * Register a precompute function under `key`.
 *
 * Call at module top-level from a feature lib:
 *   registerPrecompute('chile', (assets) => buildChileData(assets));
 *
 * Throws if `key` is already registered (prevents silent overwrites).
 */
export function registerPrecompute<T, A>(key: string, fn: PrecomputeFn<T, A>): void {
  if (registry.has(key)) {
    const existing = registry.get(key);
    const registeredBy = existing?.registeredBy ?? '(unknown location)';
    throw new Error(
      `[util-precompute] Duplicate key "${key}". ` +
        `First registered at:\n${registeredBy}`,
    );
  }
  const registeredBy = new Error().stack ?? '(stack unavailable)';
  registry.set(key, { fn: fn as PrecomputeFn<unknown, unknown>, registeredBy });
}
