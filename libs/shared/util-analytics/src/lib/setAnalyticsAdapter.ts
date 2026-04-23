import type { AnalyticsAdapter } from './analyticsAdapter';
import { setAdapter } from './analyticsRegistry';

/**
 * Replace the current analytics adapter.
 *
 * V2 usage in `apps/alphaTiles/src/_layout.tsx`:
 *   setAnalyticsAdapter(new PostHogAdapter({ apiKey: '...' }));
 *
 * Calling this multiple times is allowed — the last call wins (design.md D11).
 */
export function setAnalyticsAdapter(impl: AnalyticsAdapter): void {
  setAdapter(impl);
}
