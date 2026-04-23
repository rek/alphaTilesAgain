import { adapter, analyticsEnabled } from './analyticsRegistry';

/**
 * Record a screen view.
 *
 * `name` MUST be the expo-router route path (design.md D6):
 *   screen('/')
 *   screen('/choose-player')
 *   screen('/game/41')
 *
 * No trailing slashes except the root `'/'`. No query strings.
 * Containers call this via `useTrackScreenMount` on mount.
 *
 * No-op when `analyticsEnabled` is false.
 */
export function screen(name: string, props?: Record<string, unknown>): void {
  if (!analyticsEnabled) return;
  adapter.screen(name, props);
}
