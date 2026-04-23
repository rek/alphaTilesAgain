/**
 * Module-level analytics state.
 *
 * - `adapter` — current backend; default is the no-op.
 * - `analyticsEnabled` — gate; default false (design.md D9).
 *
 * All other files in this lib read/write these values. Keeping them in one
 * place mirrors the precomputeRegistry pattern in util-precompute.
 */
import type { AnalyticsAdapter } from './analyticsAdapter';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

export const noopAdapter: AnalyticsAdapter = {
  track: noop,
  identify: noop,
  screen: noop,
};

export let adapter: AnalyticsAdapter = noopAdapter;
export let analyticsEnabled = false;

export function setAdapter(impl: AnalyticsAdapter): void {
  adapter = impl;
}

export function setEnabled(enabled: boolean): void {
  analyticsEnabled = enabled;
}
