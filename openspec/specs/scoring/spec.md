# scoring Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Pure scoring primitives

`libs/alphaTiles/util-scoring` SHALL export only pure, React/Zustand/persistence-free helpers. Today that is `displayChallengeLevel(country, challengeLevel)` (Java `GameActivity.java:261–274`). Point and tracker accumulation is not a util-scoring concern: door progress (`recordCorrectAnswer`, `@alphaTiles/data-door-progress`) adds points and checks trackers in the progress store.

#### Scenario: Displayed challenge level

- **WHEN** `displayChallengeLevel('Thailand', 213)` is called
- **THEN** it returns `2`

#### Scenario: Correct answer adds a point and a tracker

- **WHEN** `recordCorrectAnswer({ door, playerId, afterTwelveCheckedTrackers })` runs for a `China` door with `trackerCount = 4`
- **THEN** points increase by 1 and `trackerCount` becomes `5`; a wrong answer records nothing

### Requirement: No-tracker classes

The four classes Romania, Sudan, Malaysia and Iraq are "no right/wrong" games and never check a tracker. The guard SHALL live in one place: the Door catalogue (`doorsOf`, `@alphaTiles/data-doors`) sets `Door.tracksProgress = false` for them, and `recordCorrectAnswer` skips the tracker (points only) when `tracksProgress` is false. `util-scoring` exports no country list or predicate.

#### Scenario: Tracker skip for no-tracker classes

- **WHEN** `recordCorrectAnswer` runs for a door whose class is `Romania`, `Sudan`, `Malaysia` or `Iraq` with `trackerCount = 3`
- **THEN** `trackerCount` stays `3` and no mastery action is returned

#### Scenario: Single source of truth for the guard

- **WHEN** `doorsOf(pack)` resolves a `Romania` row and a `China` row
- **THEN** the Romania door has `tracksProgress: false` and the China door `tracksProgress: true`

### Requirement: Mastery detection

Mastery is owned by door progress (`@alphaTiles/data-door-progress`, `doorProgressOf`), not `util-scoring`: a door is mastered when it tracks progress and its `trackerCount >= 12`, independent of `after12CheckedTrackers` (Java `GameActivity.updatePointsAndTrackers` / `Earth.updateDoors`). `isGameMastered`, `addPoint` and `pointsForStage` were removed (no callers).

#### Scenario: Mode 1 still masters

- **WHEN** a door that tracks progress has `trackerCount = 12` and the pack's `after12CheckedTrackers = 1`
- **THEN** `doorProgressOf(...).mastered` is `true`
