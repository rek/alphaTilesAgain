/**
 * Global precompute registry.
 *
 * Feature libs register a precompute function at module-import time via
 * `registerPrecompute`. The lang-assets runtime calls `runPrecomputes` once
 * after the language pack loads. Results are stored in `precomputeCache` and
 * exposed via `usePrecompute`.
 *
 * This file owns the shared mutable state. All other files import from here.
 *
 * See ARCHITECTURE.md §9 and design.md §D7.
 */

export type PrecomputeFn<T = unknown, A = unknown> = (assets: A) => T;

/**
 * registry: key → { fn, registeredBy }
 * registeredBy is a stack trace snippet captured at registration time so that
 * duplicate-key errors can identify the first registrant.
 */
export const registry = new Map<string, { fn: PrecomputeFn<unknown, unknown>; registeredBy: string }>();

/** Cache populated by runPrecomputes. */
export const precomputeCache = new Map<string, unknown>();
