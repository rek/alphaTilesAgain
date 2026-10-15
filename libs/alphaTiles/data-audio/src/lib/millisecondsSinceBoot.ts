/**
 * Elapsed ms since page/app start, for the `audio_unlock_web` event.
 *
 * Web: performance.now() is measured from navigation start, i.e. boot.
 * Falls back to 0 when the High Resolution Time API is missing
 * (capability check, not a platform check — design D6).
 */
export function millisecondsSinceBoot() {
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    return 0;
  }
  return Math.max(0, Math.round(performance.now()));
}
