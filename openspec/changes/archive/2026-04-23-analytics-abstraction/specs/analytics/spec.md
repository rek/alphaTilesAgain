## ADDED Requirements

### Requirement: Three-primitive analytics API

`libs/shared/util-analytics` SHALL expose exactly three call functions: `track(event, props?)`, `identify(playerId, traits?)`, and `screen(name, props?)`. Feature libraries SHALL import these from `util-analytics` and no other analytics library.

#### Scenario: Feature lib calls track

- **WHEN** a `type:feature` container calls `track('game_started', { gameDoor: 41, country: 'Chile', challengeLevel: 1, stage: 0, syllOrTile: 'tile' })`
- **THEN** the call compiles, the current adapter's `track` method is invoked with the event name and props, and no error is thrown

#### Scenario: Unknown event name is a compile error

- **WHEN** a container calls `track('made_up_event', {})`
- **THEN** TypeScript emits a compile error because `'made_up_event'` is not in the `AnalyticsEvent` union

#### Scenario: Wrong props shape is a compile error

- **WHEN** a container calls `track('game_started', { wrongKey: 1 })`
- **THEN** TypeScript emits a compile error because the props don't match the `game_started` variant's shape

### Requirement: Adapter swap seam

`setAnalyticsAdapter(impl)` SHALL replace the current adapter. The default adapter MUST be a no-op that implements all three methods but performs no side effects.

#### Scenario: Default adapter is no-op

- **WHEN** `track('app_boot', { appLang: 'eng', platform: 'ios', osVersion: '17.0' })` is called and no adapter swap has occurred
- **THEN** nothing happens (no network, no log, no error) and the call returns immediately

#### Scenario: Swap to a console adapter

- **WHEN** `setAnalyticsAdapter(consoleAdapter)` is called, then `track('app_boot', {...})` is fired
- **THEN** the consoleAdapter's `track` method receives the event name and props

#### Scenario: Re-swap is allowed

- **WHEN** `setAnalyticsAdapter(A)` is called, then `setAnalyticsAdapter(B)` is called, then `track(...)` is fired
- **THEN** only `B.track` is invoked (latest adapter wins)

### Requirement: Settings-gated firing

`setAnalyticsEnabled(bool)` SHALL control whether any of `track`, `identify`, or `screen` actually invoke the adapter. The default state MUST be `false` (disabled until a pack-level setting is loaded). When `setAnalyticsEnabled(false)`, the current adapter's methods MUST NOT be called.

#### Scenario: Default state

- **WHEN** `track('app_boot', {...})` is called before any `setAnalyticsEnabled` call
- **THEN** the current adapter is NOT invoked

#### Scenario: Enabled

- **WHEN** `setAnalyticsEnabled(true)` is called, then `track('app_boot', {...})`
- **THEN** the current adapter's `track` method is invoked

#### Scenario: Disabled

- **WHEN** `setAnalyticsEnabled(true)` is called, then `setAnalyticsEnabled(false)`, then `track(...)`
- **THEN** the current adapter is NOT invoked

### Requirement: Event catalog as typed discriminated union

`util-analytics` SHALL export `AnalyticsEvent` as a TypeScript discriminated union containing exactly these variants with the listed prop shapes:

- `player_created` — `{ avatarIndex: number }`
- `player_deleted` — `{}`
- `player_renamed` — `{}`
- `game_started` — `{ gameDoor: number; country: string; challengeLevel: number; stage: number; syllOrTile: 'syllable' | 'tile' }`
- `game_exited` — `{ gameDoor: number; pointsEarned: number; tapsMade: number; durationSeconds: number; completedTracker: boolean }`
- `game_mastery_reached` — `{ gameDoor: number; stage: number }`
- `screen_viewed` — `{ screenName: string }`
- `tile_tap_correct` — `{ gameDoor: number; tileId: string; stage: number }`
- `tile_tap_incorrect` — `{ gameDoor: number; tileId: string; stage: number }`
- `audio_unlock_web` — `{ millisecondsSinceBoot: number }`
- `app_boot` — `{ appLang: string; platform: 'ios' | 'android' | 'web'; osVersion: string }`

#### Scenario: All catalog variants compile

- **WHEN** a call site invokes each of the eleven listed `track` variants with correctly-typed props
- **THEN** all calls compile without type errors

#### Scenario: Adding a variant is a spec change

- **WHEN** a contributor proposes firing `track('new_event', {...})` that isn't in the union
- **THEN** the review gate is the spec — this spec must be updated (a new OpenSpec change) before the type is added

### Requirement: Tile-tap sampling at 10%

`tile_tap_correct` and `tile_tap_incorrect` events SHALL be sampled deterministically at 10% of calls. The sampling function MUST be based on a hash of `{ gameDoor, tileId, floor(timestamp / 100ms) }` so that sub-100ms identical events collapse to one sample decision. Sampled-through events SHALL carry a `_sampled: true` prop injected at the util-analytics layer (not by call sites) so adapters can upweight if desired.

#### Scenario: 10% of calls pass through

- **WHEN** 10000 `track('tile_tap_correct', { gameDoor: 41, tileId: 'a', stage: 0 })` calls are made with varying timestamps
- **THEN** approximately 1000 reach the adapter (within ±5% statistical variance) and each received event has `_sampled: true` attached

#### Scenario: Sub-100ms duplicate collapse

- **WHEN** two `track('tile_tap_correct', { gameDoor: 41, tileId: 'a', stage: 0 })` calls happen within 50ms
- **THEN** both calls make the same sample decision (both pass or both drop), never one-of-two

#### Scenario: Non-sampled events unaffected

- **WHEN** `track('game_started', {...})` is called
- **THEN** it reaches the adapter 100% of the time and has no `_sampled` prop attached

### Requirement: Screen naming convention — route path

`screen(name, props?)` callers SHALL pass the route path as `name` (e.g. `'/'`, `'/choose-player'`, `'/game/41'`). Route paths MUST NOT include query strings or trailing slashes (except the root `'/'`).

#### Scenario: Root screen

- **WHEN** the main menu container mounts and calls `screen('/')`
- **THEN** the adapter's `screen` method receives `'/'` as the name

#### Scenario: Game screen with door number

- **WHEN** the game-41 container mounts and calls `screen('/game/41')`
- **THEN** the adapter's `screen` method receives `'/game/41'` as the name

### Requirement: PII policy at the call-site layer

`util-analytics` SHALL NOT accept player name or device identifiers in any `props` parameter. Enforcement is via the typed catalog — no variant has a `playerName` or `deviceId` prop. Call sites physically cannot pass them without a type error.

#### Scenario: Attempt to pass player name

- **WHEN** a container writes `track('player_created', { avatarIndex: 3, playerName: 'Ana' })`
- **THEN** TypeScript emits a compile error (`playerName` is not in `player_created`'s prop shape)

#### Scenario: identify with only allowed traits

- **WHEN** a container calls `identify('uuid-123', { avatarIndex: 3 })`
- **THEN** the call compiles and the adapter receives `(playerId='uuid-123', traits={avatarIndex:3})`

### Requirement: Adapter wire format is snake_case

Adapters that transmit events off-device SHALL transform camelCase prop keys to snake_case at the wire boundary. The no-op adapter performs no transformation; real adapters MUST transform. The typed API at call sites remains camelCase.

#### Scenario: PostHog-style adapter

- **WHEN** a real adapter receives `{ gameDoor: 41, challengeLevel: 2 }` and transmits
- **THEN** the transmitted payload keys are `{ game_door: 41, challenge_level: 2 }`

#### Scenario: No-op adapter does not transform

- **WHEN** the default no-op adapter is active
- **THEN** no transformation happens (the adapter does nothing at all)
