import { adapter, analyticsEnabled } from './analyticsRegistry';

/**
 * Associate the current session with a player identity.
 *
 * - `playerId` is a local UUID (Zustand-generated) — not externally meaningful.
 * - `traits` may carry `avatarIndex` but MUST NOT carry `playerName` or any
 *   device identifier. PII policy: design.md D8.
 * - No-op when `analyticsEnabled` is false.
 */
export function identify(
  playerId: string,
  traits?: Record<string, unknown>,
): void {
  if (!analyticsEnabled) return;
  adapter.identify(playerId, traits);
}
