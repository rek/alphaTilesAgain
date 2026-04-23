import { registry, precomputeCache } from './precomputeRegistry';
import type { LangAssets } from './precomputeRegistry';

/**
 * Execute all registered precompute functions against `assets`.
 * Called once by the lang-assets runtime after the language pack loads.
 *
 * Throws if any precompute function throws — the error is re-thrown with the
 * precompute key attached so the boot sequence surfaces a clear failure.
 */
export function runPrecomputes(assets: LangAssets): Map<string, unknown> {
  precomputeCache.clear();
  for (const [key, { fn }] of registry) {
    try {
      const result = fn(assets);
      precomputeCache.set(key, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`[util-precompute] Precompute "${key}" failed: ${message}`);
    }
  }
  return precomputeCache;
}
