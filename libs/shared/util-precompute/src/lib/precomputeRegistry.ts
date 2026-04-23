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

// Real type imported from data-language-pack (type-only — no runtime dependency).
// See lang-assets-runtime design.md §D5 and precompute-registry MODIFIED spec.
// The boundary override below is intentional: type-only cycle, safe at runtime.
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { LangAssets as _LangAssets } from '@alphaTiles/data-language-pack';
export type LangAssets = _LangAssets;

export type PrecomputeFn<T = unknown> = (assets: LangAssets) => T;

/**
 * registry: key → { fn, registeredBy }
 * registeredBy is a stack trace snippet captured at registration time so that
 * duplicate-key errors can identify the first registrant.
 */
export const registry = new Map<string, { fn: PrecomputeFn; registeredBy: string }>();

/** Cache populated by runPrecomputes. */
export const precomputeCache = new Map<string, unknown>();
