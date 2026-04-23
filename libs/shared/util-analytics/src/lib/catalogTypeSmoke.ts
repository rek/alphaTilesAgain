/**
 * Compile-time type smoke tests for the AnalyticsEvent catalog.
 *
 * This file is included in tsconfig.lib.json — it must compile cleanly.
 * It verifies:
 *   - All 11 catalog variants compile with correct props (task 10.2).
 *   - Invalid calls are rejected by TypeScript via `@ts-expect-error` (task 10.3).
 *
 * Not a runtime test — no exports, no Jest.
 */

import { track } from './track';
import { identify } from './identify';
import { screen } from './screen';

// ---------------------------------------------------------------------------
// Positive: all 11 catalog variants must compile
// ---------------------------------------------------------------------------

// player_created
track('player_created', { avatarIndex: 1 });

// player_deleted — empty props
track('player_deleted', {});

// player_renamed — empty props
track('player_renamed', {});

// game_started
track('game_started', {
  gameDoor: 41,
  country: 'China',
  challengeLevel: 1,
  stage: 0,
  syllOrTile: 'syllable',
});

// game_exited
track('game_exited', {
  gameDoor: 41,
  pointsEarned: 10,
  tapsMade: 30,
  durationSeconds: 120,
  completedTracker: true,
});

// game_mastery_reached
track('game_mastery_reached', { gameDoor: 41, stage: 3 });

// screen_viewed
track('screen_viewed', { screenName: '/' });

// tile_tap_correct
track('tile_tap_correct', { gameDoor: 41, tileId: 'a', stage: 0 });

// tile_tap_incorrect
track('tile_tap_incorrect', { gameDoor: 41, tileId: 'b', stage: 1 });

// audio_unlock_web
track('audio_unlock_web', { millisecondsSinceBoot: 4200 });

// app_boot
track('app_boot', { appLang: 'eng', platform: 'ios', osVersion: '17.0' });

// identify + screen
identify('uuid-123', { avatarIndex: 2 });
screen('/choose-player');
screen('/game/41', { referrer: 'menu' });

// ---------------------------------------------------------------------------
// Negative: wrong event or wrong props → @ts-expect-error
// ---------------------------------------------------------------------------

// Unknown event name is a compile error
// @ts-expect-error — 'made_up_event' is not in AnalyticsEvent union
track('made_up_event', {});

// Wrong props shape is a compile error
// @ts-expect-error — wrongKey is not in game_started's prop shape
track('game_started', { wrongKey: 1 });

// Attempting to pass playerName in player_created is a compile error
// @ts-expect-error — playerName is not in player_created's prop shape
track('player_created', { avatarIndex: 3, playerName: 'Ana' });
