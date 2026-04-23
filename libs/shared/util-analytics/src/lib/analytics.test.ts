/**
 * Unit tests for libs/shared/util-analytics.
 *
 * Covers: track/identify/screen, enabled-gate, sampling, adapter swap,
 * duplicate-adapter-set, prop-transform helper, noop side-effects.
 *
 * Scenarios map to openspec/changes/analytics-abstraction/specs/analytics/spec.md.
 */

import { track } from './track';
import { identify } from './identify';
import { screen } from './screen';
import { setAnalyticsAdapter } from './setAnalyticsAdapter';
import { setAnalyticsEnabled } from './setAnalyticsEnabled';
import { transformPropsToSnake } from './transformPropsToSnake';
import { camelToSnake } from './camelToSnake';
import { shouldSampleTileTap } from './shouldSampleTileTap';
import { noopAdapter } from './analyticsRegistry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSpy() {
  return {
    track: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
  };
}

// Reset shared state between tests
beforeEach(() => {
  setAnalyticsAdapter(noopAdapter);
  setAnalyticsEnabled(false);
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Task 3.4 — Default state: adapter NOT invoked
// ---------------------------------------------------------------------------

describe('default state (analyticsEnabled = false)', () => {
  it('track does not invoke any adapter method', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    // NOTE: analyticsEnabled stays false (not calling setAnalyticsEnabled)
    track('app_boot', { appLang: 'eng', platform: 'ios', osVersion: '17.0' });
    expect(spy.track).not.toHaveBeenCalled();
  });

  it('identify does not invoke any adapter method', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    identify('uuid-123', { avatarIndex: 1 });
    expect(spy.identify).not.toHaveBeenCalled();
  });

  it('screen does not invoke any adapter method', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    screen('/');
    expect(spy.screen).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Task 4.3 — Adapter swap + settings gate
// ---------------------------------------------------------------------------

describe('setAnalyticsEnabled', () => {
  it('enabled=true causes track to invoke adapter', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_boot', { appLang: 'eng', platform: 'android', osVersion: '14' });
    expect(spy.track).toHaveBeenCalledWith(
      'app_boot',
      { appLang: 'eng', platform: 'android', osVersion: '14' },
    );
  });

  it('enabled=false after enabled=true silences subsequent calls', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    setAnalyticsEnabled(false);
    track('app_boot', { appLang: 'eng', platform: 'web', osVersion: 'Chrome/120' });
    expect(spy.track).not.toHaveBeenCalled();
  });

  it('identify respects enabled gate', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    identify('uuid-abc', { avatarIndex: 3 });
    expect(spy.identify).toHaveBeenCalledWith('uuid-abc', { avatarIndex: 3 });
  });

  it('screen respects enabled gate', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    screen('/choose-player');
    expect(spy.screen).toHaveBeenCalledWith('/choose-player', undefined);
  });
});

describe('setAnalyticsAdapter', () => {
  it('re-swap: only latest adapter receives calls', () => {
    const spyA = makeSpy();
    const spyB = makeSpy();
    setAnalyticsAdapter(spyA);
    setAnalyticsAdapter(spyB);
    setAnalyticsEnabled(true);
    track('app_boot', { appLang: 'eng', platform: 'ios', osVersion: '17.0' });
    expect(spyA.track).not.toHaveBeenCalled();
    expect(spyB.track).toHaveBeenCalledTimes(1);
  });

  it('setting adapter multiple times (duplicate-set) is allowed without error', () => {
    const spy = makeSpy();
    expect(() => {
      setAnalyticsAdapter(spy);
      setAnalyticsAdapter(spy);
      setAnalyticsAdapter(spy);
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Task 3.4 / Spec: Default adapter is no-op — zero side effects
// ---------------------------------------------------------------------------

describe('noop adapter — zero side effects', () => {
  it('noop track produces no observable side effect (no throw, no log)', () => {
    setAnalyticsEnabled(true);
    // Adapter is still noopAdapter from beforeEach
    expect(() => {
      track('app_boot', { appLang: 'eng', platform: 'ios', osVersion: '17.0' });
    }).not.toThrow();
  });

  it('noop identify produces no observable side effect', () => {
    setAnalyticsEnabled(true);
    expect(() => identify('uuid', {})).not.toThrow();
  });

  it('noop screen produces no observable side effect', () => {
    setAnalyticsEnabled(true);
    expect(() => screen('/')).not.toThrow();
  });

  it('noopAdapter methods are all empty functions (no console output)', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    noopAdapter.track('any_event', {});
    noopAdapter.identify('id', {});
    noopAdapter.screen('/', {});
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Task 6 — Tile-tap sampling
// ---------------------------------------------------------------------------

describe('shouldSampleTileTap', () => {
  it('roughly 10% of calls pass through with varied timestamps', () => {
    let passCount = 0;
    const base = 1_700_000_000_000;
    const total = 10_000;
    for (let i = 0; i < total; i++) {
      // Spread across many 100ms buckets by incrementing by 101ms each step
      const now = base + i * 101;
      if (shouldSampleTileTap({ gameDoor: 41, tileId: 'a' }, now)) {
        passCount++;
      }
    }
    // Within ±5%: expect between 500 and 1500
    expect(passCount).toBeGreaterThanOrEqual(500);
    expect(passCount).toBeLessThanOrEqual(1500);
  });

  it('two calls within 50ms yield the same decision', () => {
    const now = 1_700_000_000_050;
    const d1 = shouldSampleTileTap({ gameDoor: 41, tileId: 'a' }, now);
    const d2 = shouldSampleTileTap({ gameDoor: 41, tileId: 'a' }, now + 49);
    expect(d1).toBe(d2);
  });

  it('calls in different 100ms buckets may differ', () => {
    // Find two buckets that differ — deterministic via known hash
    // bucket 0 → key '41|a|0', bucket 1 → key '41|a|1'
    // We just assert both calls run without error; determinism is hash-based
    const d1 = shouldSampleTileTap({ gameDoor: 1, tileId: 'z' }, 0);
    const d2 = shouldSampleTileTap({ gameDoor: 1, tileId: 'z' }, 100);
    // Both must be boolean — content may or may not differ
    expect(typeof d1).toBe('boolean');
    expect(typeof d2).toBe('boolean');
  });
});

describe('track — tile-tap sampling integration', () => {
  it('sampled tile-tap events carry _sampled: true', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    // Find a timestamp that passes the sampler for this gameDoor/tileId
    const base = 1_700_000_000_000;
    let passedTs = 0;
    let foundPassed = false;
    for (let i = 0; i < 200; i++) {
      const ts = base + i * 101;
      if (shouldSampleTileTap({ gameDoor: 99, tileId: 'x' }, ts)) {
        passedTs = ts;
        foundPassed = true;
        break;
      }
    }
    expect(foundPassed).toBe(true);

    // Stub Date.now to return the known-passing timestamp
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(passedTs);
    track('tile_tap_correct', { gameDoor: 99, tileId: 'x', stage: 0 });
    dateSpy.mockRestore();

    expect(spy.track).toHaveBeenCalledWith(
      'tile_tap_correct',
      { gameDoor: 99, tileId: 'x', stage: 0, _sampled: true },
    );
  });

  it('tile-tap events that do not pass sampler are dropped', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    // Find a timestamp that FAILS the sampler
    const base = 1_700_000_000_000;
    let failedTs = 0;
    let foundFailed = false;
    for (let i = 0; i < 200; i++) {
      const ts = base + i * 101;
      if (!shouldSampleTileTap({ gameDoor: 88, tileId: 'y' }, ts)) {
        failedTs = ts;
        foundFailed = true;
        break;
      }
    }
    expect(foundFailed).toBe(true);

    const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(failedTs);
    track('tile_tap_correct', { gameDoor: 88, tileId: 'y', stage: 1 });
    dateSpy.mockRestore();

    expect(spy.track).not.toHaveBeenCalled();
  });

  it('non-tile-tap events reach adapter 100% of time without _sampled', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    track('game_started', {
      gameDoor: 41,
      country: 'China',
      challengeLevel: 1,
      stage: 0,
      syllOrTile: 'syllable',
    });

    expect(spy.track).toHaveBeenCalledTimes(1);
    const receivedProps = spy.track.mock.calls[0][1] as Record<string, unknown>;
    expect(receivedProps['_sampled']).toBeUndefined();
  });

  it('tile_tap_incorrect also uses sampling', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);

    // Verify 10 calls don't all pass (statistical sanity)
    let passes = 0;
    for (let i = 0; i < 100; i++) {
      const ts = 1_700_000_000_000 + i * 101;
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(ts);
      track('tile_tap_incorrect', { gameDoor: 5, tileId: 'b', stage: 2 });
      dateSpy.mockRestore();
      if (shouldSampleTileTap({ gameDoor: 5, tileId: 'b' }, ts)) passes++;
    }
    expect(spy.track).toHaveBeenCalledTimes(passes);
  });
});

// ---------------------------------------------------------------------------
// Task 7 — transformPropsToSnake / camelToSnake
// ---------------------------------------------------------------------------

describe('camelToSnake', () => {
  it("'gameDoor' → 'game_door'", () => {
    expect(camelToSnake('gameDoor')).toBe('game_door');
  });

  it("'syllOrTile' → 'syll_or_tile'", () => {
    expect(camelToSnake('syllOrTile')).toBe('syll_or_tile');
  });

  it('already-snake keys pass through unchanged', () => {
    expect(camelToSnake('game_door')).toBe('game_door');
    expect(camelToSnake('syll_or_tile')).toBe('syll_or_tile');
    expect(camelToSnake('app_lang')).toBe('app_lang');
  });

  it('single word stays lowercase', () => {
    expect(camelToSnake('stage')).toBe('stage');
  });

  it('leading uppercase is lowercased (PascalCase input)', () => {
    expect(camelToSnake('GameDoor')).toBe('_game_door');
    // PascalCase is not an expected input; just verifying deterministic behavior
  });
});

describe('transformPropsToSnake', () => {
  it('converts all camelCase keys', () => {
    expect(
      transformPropsToSnake({ gameDoor: 41, challengeLevel: 2 }),
    ).toEqual({ game_door: 41, challenge_level: 2 });
  });

  it('preserves values unchanged', () => {
    const result = transformPropsToSnake({ appLang: 'eng', osVersion: '17.0' });
    expect(result).toEqual({ app_lang: 'eng', os_version: '17.0' });
  });

  it('already-snake keys pass through', () => {
    expect(transformPropsToSnake({ game_door: 41 })).toEqual({ game_door: 41 });
  });

  it('_sampled passes through unchanged', () => {
    expect(transformPropsToSnake({ _sampled: true })).toEqual({ _sampled: true });
  });

  it('empty object returns empty object', () => {
    expect(transformPropsToSnake({})).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Task 5 — Core functions: identify + screen pass correct args
// ---------------------------------------------------------------------------

describe('identify', () => {
  it('passes playerId and traits to adapter', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    identify('uuid-123', { avatarIndex: 3 });
    expect(spy.identify).toHaveBeenCalledWith('uuid-123', { avatarIndex: 3 });
  });

  it('passes undefined traits when omitted', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    identify('uuid-456');
    expect(spy.identify).toHaveBeenCalledWith('uuid-456', undefined);
  });
});

describe('screen', () => {
  it('passes route path to adapter', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    screen('/game/41');
    expect(spy.screen).toHaveBeenCalledWith('/game/41', undefined);
  });

  it('passes props when provided', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    screen('/', { referrer: 'boot' });
    expect(spy.screen).toHaveBeenCalledWith('/', { referrer: 'boot' });
  });
});

// ---------------------------------------------------------------------------
// Task 7.3 — OTA event catalog additions
// ---------------------------------------------------------------------------

describe('OTA events (ota-updates change)', () => {
  it('app_update_available reaches adapter with correct payload', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_update_available', { updateId: 'uuid-1', channel: 'eng' });
    expect(spy.track).toHaveBeenCalledWith('app_update_available', {
      updateId: 'uuid-1',
      channel: 'eng',
    });
  });

  it('app_update_applied reaches adapter with correct payload (with fromUpdateId)', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_update_applied', {
      fromUpdateId: 'old-id',
      toUpdateId: 'new-id',
      channel: 'tpx',
    });
    expect(spy.track).toHaveBeenCalledWith('app_update_applied', {
      fromUpdateId: 'old-id',
      toUpdateId: 'new-id',
      channel: 'tpx',
    });
  });

  it('app_update_applied allows null fromUpdateId (first update)', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_update_applied', {
      fromUpdateId: null,
      toUpdateId: 'first-id',
      channel: 'eng',
    });
    expect(spy.track).toHaveBeenCalledWith('app_update_applied', {
      fromUpdateId: null,
      toUpdateId: 'first-id',
      channel: 'eng',
    });
  });

  it('app_update_failed reaches adapter with stage check and reason timeout', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_update_failed', { stage: 'check', reason: 'timeout', channel: 'eng' });
    expect(spy.track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'check',
      reason: 'timeout',
      channel: 'eng',
    });
  });

  it('app_update_failed carries errorMessage on reason error', () => {
    const spy = makeSpy();
    setAnalyticsAdapter(spy);
    setAnalyticsEnabled(true);
    track('app_update_failed', {
      stage: 'fetch',
      reason: 'error',
      errorMessage: 'Network error',
      channel: 'yue',
    });
    expect(spy.track).toHaveBeenCalledWith('app_update_failed', {
      stage: 'fetch',
      reason: 'error',
      errorMessage: 'Network error',
      channel: 'yue',
    });
  });
});
