/**
 * Deterministic 10% sampler for tile-tap events (design.md D5).
 *
 * Key = `${gameDoor}|${tileId}|${floor(nowMs / 100)}`.
 * Hash algorithm: djb2 (inline, zero deps).
 * Returns true when the event should pass through to the adapter.
 *
 * Determinism guarantees:
 * - Two calls for the same (gameDoor, tileId) within a 100 ms window produce
 *   the same decision, preventing double-sampling on rapid retaps.
 * - Reproducible in tests without mocking Math.random().
 */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // djb2: hash = ((hash << 5) + hash) + charCode  →  hash * 33 + charCode
    hash = (hash * 33) ^ str.charCodeAt(i);
    // Keep within 32-bit signed integer range
    hash = hash | 0;
  }
  return Math.abs(hash);
}

export function shouldSampleTileTap(
  props: { gameDoor: number; tileId: string },
  nowMs: number,
): boolean {
  const bucket = Math.floor(nowMs / 100);
  const key = `${props.gameDoor}|${props.tileId}|${bucket}`;
  return djb2(key) % 10 === 0;
}
