import { runOtaCheck } from '@shared/util-ota';
import { track } from '@shared/util-analytics';

// Background download — nobody waits on it, so allow slow mobile networks.
const BACKGROUND_FETCH_TIMEOUT_MS = 120_000;

/**
 * Fire-and-forget OTA check (native only). Checks the binary's channel on
 * launch, downloads any update in the background without blocking boot, and
 * leaves it for expo-updates to launch on the next cold start. Never reloads
 * mid-session. runOtaCheck never throws.
 */
export function startOtaCheck(): void {
  void runOtaCheck({ reload: false, fetchTimeoutMs: BACKGROUND_FETCH_TIMEOUT_MS, track });
}
