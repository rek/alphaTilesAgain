import * as Updates from 'expo-updates';
import type { OtaCheckResult, AnalyticsTrack } from './otaTypes';
import { truncateMessage } from './truncateMessage';

const DEFAULT_CHECK_TIMEOUT_MS = 5_000;
const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

/**
 * Race a promise against a timeout. Rejects with a dedicated sentinel on timeout.
 * Uses .unref() so the timer does not prevent the process from exiting in tests.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new TimeoutError()), ms);
      // .unref() is available in Node; on React Native, setTimeout returns a number
      if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
        (timer as { unref: () => void }).unref();
      }
    }),
  ]);
}

class TimeoutError extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

/**
 * Resolve the OTA channel: prefer the compiled binary's channel from expo-updates;
 * fall back to APP_LANG env for dev / unconfigured environments.
 * See openspec/changes/ota-updates/design.md D4, D5.
 */
function resolveChannel(): string {
  return Updates.channel ?? process.env['APP_LANG'] ?? 'unknown';
}

/**
 * Boot-time OTA update check.
 *
 * - Short-circuits if `Updates.isEnabled === false` (dev builds).
 * - Races `checkForUpdateAsync` against `checkTimeoutMs`.
 * - On update available: races `fetchUpdateAsync` against `fetchTimeoutMs`,
 *   then calls `reloadAsync`.
 * - All failures fall through; never throws.
 *
 * Callers (loading-screen boot flow) invoke this after i18n init and before
 * game menu mount. See openspec/changes/ota-updates/design.md D1.
 */
export async function runOtaCheck(opts?: {
  checkTimeoutMs?: number;
  fetchTimeoutMs?: number;
  track?: AnalyticsTrack;
}): Promise<OtaCheckResult> {
  const checkTimeoutMs = opts?.checkTimeoutMs ?? DEFAULT_CHECK_TIMEOUT_MS;
  const fetchTimeoutMs = opts?.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const trackFn = opts?.track;

  // D5: skip entirely in dev builds
  if (!Updates.isEnabled) {
    return { kind: 'disabled' };
  }

  const channel = resolveChannel();

  // --- check phase ---
  let checkResult: Awaited<ReturnType<typeof Updates.checkForUpdateAsync>>;
  try {
    checkResult = await withTimeout(Updates.checkForUpdateAsync(), checkTimeoutMs);
  } catch (err) {
    if (err instanceof TimeoutError) {
      trackFn?.('app_update_failed', { stage: 'check', reason: 'timeout', channel });
      return { kind: 'timeout' };
    }
    const msg = err instanceof Error ? truncateMessage(err.message) : 'unknown error';
    trackFn?.('app_update_failed', { stage: 'check', reason: 'error', errorMessage: msg, channel });
    return { kind: 'error', error: msg };
  }

  if (!checkResult.isAvailable) {
    return { kind: 'no-update' };
  }

  // update available — fire event then fetch
  const updateId: string = checkResult.updateId ?? 'unknown';
  trackFn?.('app_update_available', { updateId, channel });

  // --- fetch phase ---
  let fetchResult: Awaited<ReturnType<typeof Updates.fetchUpdateAsync>>;
  try {
    fetchResult = await withTimeout(Updates.fetchUpdateAsync(), fetchTimeoutMs);
  } catch (err) {
    if (err instanceof TimeoutError) {
      trackFn?.('app_update_failed', { stage: 'fetch', reason: 'timeout', channel });
      return { kind: 'timeout' };
    }
    const msg = err instanceof Error ? truncateMessage(err.message) : 'unknown error';
    trackFn?.('app_update_failed', { stage: 'fetch', reason: 'error', errorMessage: msg, channel });
    return { kind: 'error', error: msg };
  }

  if (!fetchResult.isNew) {
    // Nothing new to apply — continue with bundled
    return { kind: 'no-update' };
  }

  // --- reload phase ---
  try {
    await Updates.reloadAsync();
  } catch (err) {
    const msg = err instanceof Error ? truncateMessage(err.message) : 'unknown error';
    trackFn?.('app_update_failed', { stage: 'reload', reason: 'error', errorMessage: msg, channel });
    return { kind: 'error', error: msg };
  }

  // reloadAsync succeeded — the app restarts; this line is unreachable in production
  return { kind: 'applied', updateId };
}
