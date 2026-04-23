## ADDED Requirements

### Requirement: Per-player per-game per-stage progress store

`libs/alphaTiles/data-progress` SHALL expose a Zustand store `useProgressStore` that holds a map `progress: Record<ProgressKey, ProgressEntry>` where `ProgressEntry = { points, trackerCount, checked12Trackers, lastPlayed }`. Keys SHALL be built by `buildGameUniqueId({ country, challengeLevel, playerId, syllableGame, stage })` and MUST match the Java `uniqueGameLevelPlayerModeStageID` string construction (`className + challengeLevel + playerString + syllableGame + stage`) exactly, substituting `country` for the fully-qualified Java class name to keep keys portable.

#### Scenario: Key construction

- **WHEN** `buildGameUniqueId({ country: 'China', challengeLevel: 1, playerId: 'player01', syllableGame: '', stage: 1 })` is called
- **THEN** it returns the string `China1player011` (matches Java's concatenation for the country-derived className)

#### Scenario: Empty syllableGame is the empty string

- **WHEN** `syllableGame` is `''` (the normal case for non-syllable games)
- **THEN** the resulting key has no placeholder character at that position (matches Java — `String.valueOf(null)` and `""` both produce `""` in the concatenation for that slot)

### Requirement: Actions for scoring and tracker updates

The store SHALL expose actions: `incrementPoints(key, delta)`, `incrementTracker(key)`, `markChecked12(key)`, `resetGame(key)`. Actions SHALL be deterministic and idempotent within a single invocation (calling `incrementTracker` twice produces `+2`, not `+1`).

#### Scenario: `incrementPoints`

- **WHEN** the entry for key K is `{ points: 5, trackerCount: 3, checked12Trackers: false }`
- **AND** `incrementPoints(K, 4)` is dispatched
- **THEN** the entry becomes `{ points: 9, trackerCount: 3, checked12Trackers: false, lastPlayed: <now> }`

#### Scenario: `incrementTracker` with tracker-capable country

- **WHEN** key K represents a `China` game and `incrementTracker(K)` is dispatched
- **THEN** `trackerCount` increments by 1

#### Scenario: `incrementTracker` skipped for no-tracker country

- **WHEN** key K represents a `Romania` game and `incrementTracker(K)` is dispatched
- **THEN** `trackerCount` stays unchanged (the store consults `util-scoring.shouldIncrementTracker` based on the `country` portion of the key — or the caller passes `country` explicitly, whichever is implemented)

#### Scenario: `markChecked12`

- **WHEN** `trackerCount` reaches 12 for key K and `markChecked12(K)` is dispatched
- **THEN** `checked12Trackers` becomes `true` and persists across app restarts (Java: `prefs.putBoolean(uniqueGameLevelPlayerModeStageID + "_hasChecked12Trackers", true)`)

#### Scenario: `resetGame`

- **WHEN** `resetGame(K)` is dispatched
- **THEN** the entry is removed from `progress` and the next access returns the default empty entry

### Requirement: Persistence via Zustand persist + AsyncStorage

The store SHALL wrap itself in Zustand's `persist` middleware with an AsyncStorage driver (per ADR-005). The persist key SHALL be `alphaTiles.progress.v1`. On store rehydrate the in-memory map MUST equal the pre-quit state for the same user installation.

#### Scenario: Rehydrate after restart

- **WHEN** the user earns 5 points, force-quits, and re-opens the app
- **THEN** `progress[K].points === 5` after the store hydrates

#### Scenario: Persist key namespace

- **WHEN** `AsyncStorage.getItem('alphaTiles.progress.v1')` is called on a fresh install
- **THEN** it returns `null`; after any action, it returns serialized state

#### Scenario: No migration in v1

- **WHEN** the persist key is changed in a future version
- **THEN** no automatic migration runs (v1 rule per ADR-005); the new key starts empty

### Requirement: Progress selectors expose derived values

The library SHALL expose selector hooks `useProgressEntry(key)` and `useTotalPoints(playerId)`. `useTotalPoints` SHALL sum `progress[k].points` for every key where the `playerId` portion matches — used by the score bar's global-points display (Java `globalPoints`).

#### Scenario: `useProgressEntry` returns default when missing

- **WHEN** `useProgressEntry('NonExistentKey')` is called
- **THEN** it returns `{ points: 0, trackerCount: 0, checked12Trackers: false, lastPlayed: 0 }` (default, not `undefined`)

#### Scenario: `useTotalPoints` aggregates

- **WHEN** the store has entries for keys `China1player011` (5 points) and `Chile1player011` (3 points) for player `player01`
- **THEN** `useTotalPoints('player01')` returns `8`

#### Scenario: `useTotalPoints` isolates players

- **WHEN** the store has entries for `player01` (total 8) and `player02` (total 4)
- **THEN** `useTotalPoints('player01')` returns `8` and `useTotalPoints('player02')` returns `4`
