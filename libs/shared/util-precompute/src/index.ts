export { registerPrecompute } from './lib/registerPrecompute';
export { runPrecomputes } from './lib/runPrecomputes';
// usePrecompute moved to @alphaTiles/data-language-assets (design.md §D7).
// PrecomputeProvider removed — precomputes now live in LangAssets.precomputes.
export type { PrecomputeFn } from './lib/precomputeRegistry';
