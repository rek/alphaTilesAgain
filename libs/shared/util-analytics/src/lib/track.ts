import type { AnalyticsEvent } from './analyticsEvent';
import { adapter, analyticsEnabled } from './analyticsRegistry';
import { shouldSampleTileTap } from './shouldSampleTileTap';

const SAMPLED_EVENTS = new Set<AnalyticsEvent['type']>([
  'tile_tap_correct',
  'tile_tap_incorrect',
]);

/**
 * Fire a typed analytics event.
 *
 * - No-op when `analyticsEnabled` is false (design.md D9).
 * - `tile_tap_correct` / `tile_tap_incorrect` are sampled at 10% via
 *   deterministic hash; passing events receive `_sampled: true` in props
 *   so adapters can upweight by 10× (design.md D5).
 * - All other events reach the adapter 100% of the time.
 */
export function track<E extends AnalyticsEvent>(
  event: E['type'],
  props?: E['props'],
): void {
  if (!analyticsEnabled) return;

  if (SAMPLED_EVENTS.has(event)) {
    const tileTapProps = props as { gameDoor: number; tileId: string; stage: number };
    if (!shouldSampleTileTap(tileTapProps, Date.now())) return;
    adapter.track(event, { ...tileTapProps, _sampled: true });
    return;
  }

  adapter.track(event, props as Record<string, unknown> | undefined);
}
