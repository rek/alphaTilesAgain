/**
 * usePrecompute has moved to @alphaTiles/data-language-assets.
 *
 * This file is kept as a pointer to avoid broken imports in the transition
 * period. Import from @alphaTiles/data-language-assets instead.
 *
 * See lang-assets-runtime design.md §D7.
 *
 * @deprecated Import usePrecompute from '@alphaTiles/data-language-assets'
 */

// Re-exporting here would create a runtime circular dependency.
// Callers must update their import to @alphaTiles/data-language-assets.
// See design.md §D7: PrecomputeProvider removed; precomputes live in LangAssets.
export {};
