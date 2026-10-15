# scoring Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Pure scoring primitives

`libs/alphaTiles/util-scoring` SHALL export pure functions for point accumulation and tracker-count derivation. These functions MUST be free of React, Zustand, persistence, and UI imports.

#### Scenario: `computeTrackerCount` for correct answer

- **WHEN** `computeTrackerCount(4, true, 'China')` is called
- **THEN** it returns `5`

#### Scenario: `computeTrackerCount` for incorrect answer

- **WHEN** `computeTrackerCount(4, false, 'China')` is called
- **THEN** it returns `4` (unchanged)

### Requirement: No-tracker-country guard

The four countries Romania, Sudan, Malaysia, and Iraq are "no right/wrong" games; their mechanics never increment the tracker count. `util-scoring` SHALL export a `NO_TRACKER_COUNTRIES` tuple and a `shouldIncrementTracker(country)` predicate. `computeTrackerCount` SHALL consult this predicate before incrementing.

#### Scenario: Tracker skip for Romania

- **WHEN** `computeTrackerCount(3, true, 'Romania')` is called
- **THEN** it returns `3` (no increment)

#### Scenario: Tracker skip for Sudan, Malaysia, Iraq

- **WHEN** `computeTrackerCount(3, true, country)` is called for each of `'Sudan'`, `'Malaysia'`, `'Iraq'`
- **THEN** each returns `3`

#### Scenario: Single source of truth for the guard

- **WHEN** `shouldIncrementTracker('Romania')` is called
- **THEN** it returns `false`

- **WHEN** `shouldIncrementTracker('China')` is called
- **THEN** it returns `true`

### Requirement: Mastery detection

Mastery is owned by door progress (`@alphaTiles/data-door-progress`, `doorProgressOf`), not `util-scoring`: a door is mastered when it tracks progress and its `trackerCount >= 12`, independent of `after12CheckedTrackers` (Java `GameActivity.updatePointsAndTrackers` / `Earth.updateDoors`). `isGameMastered`, `addPoint` and `pointsForStage` were removed (no callers).

#### Scenario: Mode 1 still masters

- **WHEN** a door that tracks progress has `trackerCount = 12` and the pack's `after12CheckedTrackers = 1`
- **THEN** `doorProgressOf(...).mastered` is `true`
