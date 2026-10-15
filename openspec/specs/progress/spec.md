# progress Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Per-player per-game per-stage progress store

`libs/alphaTiles/data-progress` SHALL expose a Zustand store `useProgressStore` that holds a map `progress: Record<ProgressKey, ProgressEntry>` where `ProgressEntry = { points, trackerCount, lastPlayed, roundCursor?, checked12Trackers? (legacy, unread) }`. Keys SHALL be built only by `Door.progressKey(playerId)` (`@alphaTiles/data-doors`) and MUST match the Java `uniqueGameLevelPlayerModeStageID` string construction (`className + challengeLevel + playerString + syllableGame + stage`) exactly, substituting `country` for the fully-qualified Java class name to keep keys portable.

#### Scenario: Key construction

- **WHEN** `door.progressKey('player01')` is called for the door of `aa_games.txt` row `China`, challenge level 1, tile variant, stage 1
- **THEN** it returns the string `China1player011` (matches Java's concatenation for the country-derived className)

#### Scenario: Tile variant has no syllable marker

- **WHEN** the door's variant is not `S` (the normal case for non-syllable games)
- **THEN** the resulting key has no placeholder character at that position (matches Java — `String.valueOf(null)` and `""` both produce `""` in the concatenation for that slot); an `S` door gets `S` there

### Requirement: Actions for scoring and tracker updates

The store SHALL expose actions: `incrementPoints(key, delta)`, `incrementTracker(key)`, `setRoundCursor(key, cursor)` (Thailand resume position), `resetGame(key)`. Actions SHALL be deterministic and idempotent within a single invocation (calling `incrementTracker` twice produces `+2`, not `+1`). The store knows nothing of game classes: which doors check trackers is decided by door progress (`recordCorrectAnswer`, which skips `incrementTracker` for doors with `tracksProgress: false`).

#### Scenario: `incrementPoints`

- **WHEN** the entry for key K is `{ points: 5, trackerCount: 3 }`
- **AND** `incrementPoints(K, 4)` is dispatched
- **THEN** the entry becomes `{ points: 9, trackerCount: 3, lastPlayed: <now> }`

#### Scenario: `incrementTracker` increments any key

- **WHEN** `incrementTracker(K)` is dispatched
- **THEN** `trackerCount` for K increments by 1

#### Scenario: No-tracker door skips the tracker (door progress)

- **WHEN** a correct answer is recorded on a `Romania` door via `recordCorrectAnswer`
- **THEN** `incrementTracker` is never dispatched for its key, so `trackerCount` stays unchanged

#### Scenario: No mastery flag

- **WHEN** `trackerCount` reaches 12 for key K
- **THEN** nothing else is written; mastery is derived from `trackerCount` by door progress (`@alphaTiles/data-door-progress`). `checked12Trackers` survives only as an optional legacy field in persisted entries and is never read.

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

The library SHALL expose the selector hook `useTotalPoints(playerId)` (per-door reads go through door progress, `@alphaTiles/data-door-progress`). `useTotalPoints` SHALL sum `progress[k].points` for every key where the `playerId` portion matches — used by the score bar's global-points display (Java `globalPoints`).

#### Scenario: `useTotalPoints` aggregates

- **WHEN** the store has entries for keys `China1player011` (5 points) and `Chile1player011` (3 points) for player `player01`
- **THEN** `useTotalPoints('player01')` returns `8`

#### Scenario: `useTotalPoints` isolates players

- **WHEN** the store has entries for `player01` (total 8) and `player02` (total 4)
- **THEN** `useTotalPoints('player01')` returns `8` and `useTotalPoints('player02')` returns `4`

