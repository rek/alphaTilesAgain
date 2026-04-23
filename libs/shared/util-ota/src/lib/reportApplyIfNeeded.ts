import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import type { AnalyticsTrack } from './otaTypes';

const STORAGE_KEY = 'ota.lastUpdateId';

/**
 * Resolve the OTA channel: prefer the compiled binary's channel from expo-updates;
 * fall back to APP_LANG env for dev / unconfigured environments.
 */
function resolveChannel(): string {
  return Updates.channel ?? process.env['APP_LANG'] ?? 'unknown';
}

/**
 * Called at app boot (after successful mount) to detect cross-reload update applies.
 *
 * Reads the persisted `ota.lastUpdateId` from AsyncStorage, compares against the
 * current `Updates.updateId`. If they differ, fires `app_update_applied` and
 * persists the new id. On first launch (no persisted value), suppresses the event
 * and persists the current id.
 *
 * See openspec/changes/ota-updates/design.md D6.
 */
export async function reportApplyIfNeeded(opts?: {
  track?: AnalyticsTrack;
}): Promise<void> {
  const trackFn = opts?.track;

  const persisted = await AsyncStorage.getItem(STORAGE_KEY);
  const currentId: string | null = Updates.updateId ?? null;

  if (persisted === null) {
    // First-ever launch — persist current id, no event
    if (currentId !== null) {
      await AsyncStorage.setItem(STORAGE_KEY, currentId);
    }
    return;
  }

  if (currentId === null || persisted === currentId) {
    // No change — do nothing
    return;
  }

  // Different id → update was applied
  const channel = resolveChannel();
  trackFn?.('app_update_applied', {
    fromUpdateId: persisted,
    toUpdateId: currentId,
    channel,
  });

  await AsyncStorage.setItem(STORAGE_KEY, currentId);
}
