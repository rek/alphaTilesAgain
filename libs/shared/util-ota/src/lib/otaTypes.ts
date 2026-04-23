import type { AnalyticsEvent } from '@shared/util-analytics';

/**
 * Result discriminated union for runOtaCheck().
 * See openspec/changes/ota-updates/design.md D9.
 */
export type OtaCheckResult =
  | { kind: 'disabled' }
  | { kind: 'no-update' }
  | { kind: 'timeout' }
  | { kind: 'error'; error: string }
  | { kind: 'applied'; updateId: string };

/**
 * Minimal track function type accepted by util-ota functions.
 * Mirrors the signature exported by @shared/util-analytics.
 */
export type AnalyticsTrack = <E extends AnalyticsEvent>(
  event: E['type'],
  props?: E['props'],
) => void;
