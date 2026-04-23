/**
 * AnalyticsEvent discriminated union — the complete v1 event catalog.
 *
 * All variants use camelCase props at the call-site boundary. Adapters that
 * transmit off-device are responsible for snake_case conversion via
 * `transformPropsToSnake`. See design.md D7.
 *
 * To add a new event: open an OpenSpec change that updates this spec, then
 * add the variant here. Adding a variant without a spec change is a process
 * violation — the discriminated union is the review gate (design.md D2).
 */
export type AnalyticsEvent =
  | { type: 'player_created'; props: { avatarIndex: number } }
  | { type: 'player_deleted'; props: Record<string, never> }
  | { type: 'player_renamed'; props: Record<string, never> }
  | {
      type: 'game_started';
      props: {
        gameDoor: number;
        country: string;
        challengeLevel: number;
        stage: number;
        syllOrTile: 'syllable' | 'tile';
      };
    }
  | {
      type: 'game_exited';
      props: {
        gameDoor: number;
        pointsEarned: number;
        tapsMade: number;
        durationSeconds: number;
        completedTracker: boolean;
      };
    }
  | { type: 'game_mastery_reached'; props: { gameDoor: number; stage: number } }
  | { type: 'screen_viewed'; props: { screenName: string } }
  | { type: 'tile_tap_correct'; props: { gameDoor: number; tileId: string; stage: number } }
  | { type: 'tile_tap_incorrect'; props: { gameDoor: number; tileId: string; stage: number } }
  | { type: 'audio_unlock_web'; props: { millisecondsSinceBoot: number } }
  | {
      type: 'app_boot';
      props: {
        appLang: string;
        platform: 'ios' | 'android' | 'web';
        osVersion: string;
      };
    };
