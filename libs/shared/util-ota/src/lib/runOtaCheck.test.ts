/**
 * Unit tests for runOtaCheck.
 *
 * expo-updates is mocked at the module boundary — no real network calls.
 * Covers all 5 OtaCheckResult kinds + analytics event emission.
 *
 * Scenarios map to openspec/changes/ota-updates/specs/ota-updates/spec.md.
 */

import { runOtaCheck } from './runOtaCheck';

// ---------------------------------------------------------------------------
// Mock expo-updates
// ---------------------------------------------------------------------------

const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();

jest.mock('expo-updates', () => ({
  isEnabled: true,
  channel: 'eng',
  updateId: 'current-update-id',
  checkForUpdateAsync: (...args: unknown[]) => mockCheckForUpdateAsync(...args),
  fetchUpdateAsync: (...args: unknown[]) => mockFetchUpdateAsync(...args),
  reloadAsync: (...args: unknown[]) => mockReloadAsync(...args),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrackSpy() {
  return jest.fn();
}

/** Build an Updates mock that returns isEnabled = false */
function setUpdatesEnabled(enabled: boolean) {
  const mod = jest.requireMock('expo-updates') as Record<string, unknown>;
  mod['isEnabled'] = enabled;
}

beforeEach(() => {
  jest.clearAllMocks();
  setUpdatesEnabled(true);
});

// ---------------------------------------------------------------------------
// 5.6.1 — isEnabled: false → kind: 'disabled', no events
// ---------------------------------------------------------------------------

describe('when Updates.isEnabled is false', () => {
  it('returns kind disabled without firing any events', async () => {
    setUpdatesEnabled(false);
    const track = makeTrackSpy();
    const result = await runOtaCheck({ track });
    expect(result).toEqual({ kind: 'disabled' });
    expect(track).not.toHaveBeenCalled();
    expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5.6.4 — no update available → kind: 'no-update', no events
// ---------------------------------------------------------------------------

describe('when no update is available', () => {
  it('returns kind no-update without firing any events', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });
    const track = makeTrackSpy();
    const result = await runOtaCheck({ track });
    expect(result).toEqual({ kind: 'no-update' });
    expect(track).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5.6.2 — check timeout → kind: 'timeout', app_update_failed stage:check reason:timeout
// ---------------------------------------------------------------------------

describe('when checkForUpdateAsync times out', () => {
  it('returns kind timeout and fires app_update_failed with stage check, reason timeout', async () => {
    // Never resolves — will lose to the timeout
    mockCheckForUpdateAsync.mockReturnValue(new Promise(() => undefined));
    const track = makeTrackSpy();

    const result = await runOtaCheck({ checkTimeoutMs: 10, track });

    expect(result).toEqual({ kind: 'timeout' });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'check',
      reason: 'timeout',
      channel: 'eng',
    });
  });
});

// ---------------------------------------------------------------------------
// 5.6.3 — check error → kind: 'error', app_update_failed stage:check reason:error
// ---------------------------------------------------------------------------

describe('when checkForUpdateAsync throws', () => {
  it('returns kind error and fires app_update_failed with stage check, reason error', async () => {
    mockCheckForUpdateAsync.mockRejectedValue(new Error('Network failure'));
    const track = makeTrackSpy();

    const result = await runOtaCheck({ track });

    expect(result).toEqual({ kind: 'error', error: 'Network failure' });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'check',
      reason: 'error',
      errorMessage: 'Network failure',
      channel: 'eng',
    });
  });

  it('truncates errorMessage to 256 chars', async () => {
    const longMsg = 'x'.repeat(300);
    mockCheckForUpdateAsync.mockRejectedValue(new Error(longMsg));
    const track = makeTrackSpy();

    await runOtaCheck({ track });

    const payload = track.mock.calls[0][1] as Record<string, unknown>;
    expect((payload['errorMessage'] as string).length).toBe(256);
  });
});

// ---------------------------------------------------------------------------
// 5.6.5 — update available + fetch + reload → app_update_available fired, reloadAsync called
// ---------------------------------------------------------------------------

describe('when update available, fetch succeeds, reload succeeds', () => {
  it('fires app_update_available and calls reloadAsync', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true, updateId: 'new-id' });
    mockFetchUpdateAsync.mockResolvedValue({ isNew: true });
    mockReloadAsync.mockResolvedValue(undefined);
    const track = makeTrackSpy();

    const result = await runOtaCheck({ track });

    // reloadAsync restarts the app; result is still applied (unreachable in prod)
    expect(result).toEqual({ kind: 'applied', updateId: 'new-id' });
    expect(track).toHaveBeenCalledWith('app_update_available', {
      updateId: 'new-id',
      channel: 'eng',
    });
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  it('does not fire app_update_failed on success path', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true, updateId: 'new-id' });
    mockFetchUpdateAsync.mockResolvedValue({ isNew: true });
    mockReloadAsync.mockResolvedValue(undefined);
    const track = makeTrackSpy();

    await runOtaCheck({ track });

    const failCalls = (track.mock.calls as Array<[string, unknown]>).filter(
      ([event]) => event === 'app_update_failed',
    );
    expect(failCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5.6.6 — fetch timeout → kind: 'timeout', app_update_failed stage:fetch reason:timeout
// ---------------------------------------------------------------------------

describe('when fetchUpdateAsync times out', () => {
  it('returns kind timeout and fires app_update_failed with stage fetch, reason timeout', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true, updateId: 'new-id' });
    // Never resolves
    mockFetchUpdateAsync.mockReturnValue(new Promise(() => undefined));
    const track = makeTrackSpy();

    const result = await runOtaCheck({ fetchTimeoutMs: 10, track });

    expect(result).toEqual({ kind: 'timeout' });
    expect(track).toHaveBeenCalledWith('app_update_available', expect.objectContaining({ channel: 'eng' }));
    expect(track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'fetch',
      reason: 'timeout',
      channel: 'eng',
    });
  });
});

// ---------------------------------------------------------------------------
// 5.6.7 — reload error → kind: 'error', app_update_failed stage:reload reason:error
// ---------------------------------------------------------------------------

describe('when reloadAsync throws', () => {
  it('returns kind error and fires app_update_failed with stage reload, reason error', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true, updateId: 'new-id' });
    mockFetchUpdateAsync.mockResolvedValue({ isNew: true });
    mockReloadAsync.mockRejectedValue(new Error('Reload failed'));
    const track = makeTrackSpy();

    const result = await runOtaCheck({ track });

    expect(result).toEqual({ kind: 'error', error: 'Reload failed' });
    expect(track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'reload',
      reason: 'error',
      errorMessage: 'Reload failed',
      channel: 'eng',
    });
  });
});

// ---------------------------------------------------------------------------
// fetch error
// ---------------------------------------------------------------------------

describe('when fetchUpdateAsync throws', () => {
  it('returns kind error and fires app_update_failed with stage fetch, reason error', async () => {
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: true, updateId: 'new-id' });
    mockFetchUpdateAsync.mockRejectedValue(new Error('Fetch error'));
    const track = makeTrackSpy();

    const result = await runOtaCheck({ track });

    expect(result).toEqual({ kind: 'error', error: 'Fetch error' });
    expect(track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'fetch',
      reason: 'error',
      errorMessage: 'Fetch error',
      channel: 'eng',
    });
  });
});

// ---------------------------------------------------------------------------
// channel fallback — APP_LANG used when Updates.channel is unavailable
// ---------------------------------------------------------------------------

describe('channel fallback', () => {
  it('uses APP_LANG env when Updates.channel is undefined', async () => {
    const mod = jest.requireMock('expo-updates') as Record<string, unknown>;
    const originalChannel = mod['channel'];
    mod['channel'] = undefined;
    process.env['APP_LANG'] = 'tpx';

    mockCheckForUpdateAsync.mockRejectedValue(new Error('err'));
    const track = makeTrackSpy();

    await runOtaCheck({ track });

    const payload = track.mock.calls[0][1] as { channel: string };
    expect(payload.channel).toBe('tpx');

    mod['channel'] = originalChannel;
    delete process.env['APP_LANG'];
  });
});
