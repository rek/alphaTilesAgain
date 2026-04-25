# Japan Missing Tile Game Specification

## Requirements

### Requirement: Identifying missing tile

The game SHALL present a word with one tile replaced by a gap, and N tile choices (1 correct + N-1 distractors).

#### Scenario: Selection of correct tile
- **GIVEN** word "a_ple" (correct tile "p") and choices ["p", "b", "c", "d"]
- **WHEN** user selects "p"
- **THEN** `shell.incrementPointsAndTracker(1)` is called, word is completed, and round is won

#### Scenario: Selection of incorrect tile
- **GIVEN** word "a_ple" and choices ["p", "b", "c", "d"]
- **WHEN** user selects "b"
- **THEN** `shell.playIncorrect()` is called

### Requirement: Challenge level scales choice count

The number of tile choices MUST scale with `challengeLevel`:
- Level 1 → 2 choices (1 correct + 1 distractor)
- Level 2 → 4 choices (1 correct + 3 distractors)
- Level 3 → 6 choices (1 correct + 5 distractors)

#### Scenario: Level 1 has 2 choices
- **GIVEN** `challengeLevel` is 1
- **WHEN** a round is set up
- **THEN** exactly 2 tile choices are displayed

#### Scenario: Level 3 has 6 choices
- **GIVEN** `challengeLevel` is 3
- **WHEN** a round is set up
- **THEN** exactly 6 tile choices are displayed

### Requirement: Missing tile position is random

The index of the tile removed from the word MUST be chosen randomly each round.

#### Scenario: Missing tile varies
- **GIVEN** multiple rounds on the same word
- **WHEN** each round is set up
- **THEN** the missing tile index is not always the same position

### Requirement: Distractor tiles are distinct from correct tile

All distractor tiles MUST differ from the correct tile (and from each other).

#### Scenario: Distractors are unique
- **GIVEN** a round is set up with N choices
- **WHEN** inspecting the choices array
- **THEN** no two choices share the same tile text

### Requirement: Container / Presenter split

`<JapanContainer>` SHALL own all hooks and logic. `<JapanScreen>` SHALL be a pure props→JSX presenter with no hook imports.

#### Scenario: Presenter audit
- **WHEN** `JapanScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `useLangAssets`, or `useTranslation` calls
