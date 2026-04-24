# scoring Specification

## Purpose
TBD - created by archiving change game-engine-base. Update Purpose after archive.
## Requirements
### Requirement: Pure scoring primitives

`libs/alphaTiles/util-scoring` SHALL export pure functions for point accumulation and tracker-count derivation. These functions MUST be free of React, Zustand, persistence, and UI imports.

#### Scenario: `addPoint` accumulates and clamps

- **WHEN** `addPoint(5, 3)` is called
- **THEN** it returns `8`

- **WHEN** `addPoint(2, -5)` is called
- **THEN** it returns `0` (clamped non-negative)

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

`isGameMastered(trackerCount, checked12Trackers, after12CheckedTrackers)` SHALL return `true` when the player has earned 12 trackers AND the pack's `after12CheckedTrackers` setting is `2` or `3` (modes that gate progress) OR `checked12Trackers` is already `true` (sticky flag from a prior session).

#### Scenario: First mastery under mode 3

- **WHEN** `isGameMastered(12, false, 3)` is called
- **THEN** it returns `true`

#### Scenario: Mode 1 never gates mastery

- **WHEN** `isGameMastered(12, false, 1)` is called
- **THEN** it returns `false` (mode 1 keeps players in the same game indefinitely)

#### Scenario: Sticky mastery survives across sessions

- **WHEN** `isGameMastered(0, true, 1)` is called (player hit 12 last session; now resumed at 0)
- **THEN** it returns `true`

### Requirement: Stage-scaled scoring hook

`pointsForStage(stage, isCorrect)` SHALL return the points awarded for a correct/incorrect answer at a given stage. V1 returns `1` for any correct answer and `0` otherwise, matching the `updatePointsAndTrackers(4)` / `updatePointsAndTrackers(0)` caller sites in `GameActivity` (the literal `4` in `China.java:262` is points-per-full-board, not per-tile; scoring of sub-events is v1-uniform). The signature exists to let future packs scale points by stage without touching caller sites.

#### Scenario: Default scoring

- **WHEN** `pointsForStage(3, true)` is called
- **THEN** it returns `1`

- **WHEN** `pointsForStage(3, false)` is called
- **THEN** it returns `0`

### Requirement: Challenge-level display mapping

`displayChallengeLevel(country, challengeLevel)` SHALL return the integer shown in the yellow challenge-level box of the score bar. Logic ports `GameActivity.java:261–274` verbatim:

- Thailand: `Math.floor(challengeLevel / 100)`
- Brazil: `challengeLevel > 3 && challengeLevel !== 7` → `displayed - 3`, else `displayed`
- Georgia: `challengeLevel > 6` → `displayed - 6`, else `displayed`
- All others: `challengeLevel` unchanged

#### Scenario: Thailand

- **WHEN** `displayChallengeLevel('Thailand', 213)` is called
- **THEN** it returns `2`

#### Scenario: Brazil > 3

- **WHEN** `displayChallengeLevel('Brazil', 5)` is called
- **THEN** it returns `2` (5 − 3)

#### Scenario: Brazil = 7 (special case)

- **WHEN** `displayChallengeLevel('Brazil', 7)` is called
- **THEN** it returns `7` (the >3 subtract-3 rule is skipped for `7`)

#### Scenario: Georgia > 6

- **WHEN** `displayChallengeLevel('Georgia', 9)` is called
- **THEN** it returns `3`

#### Scenario: China unchanged

- **WHEN** `displayChallengeLevel('China', 1)` is called
- **THEN** it returns `1`

