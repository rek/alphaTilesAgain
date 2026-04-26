# Romania Scanning Game Specification

## Requirements

### Requirement: Word filtering based on scanSetting

The game SHALL filter the words displayed for a focus tile based on the `scanSetting` from the language pack.

#### Scenario: scanSetting 1 (Initial Only)
- **GIVEN** focus tile "a" and words ["apple", "banana", "cat", "bat"]
- **WHEN** scanSetting is 1
- **THEN** the game only displays ["apple"] (words where "a" is the first tile)

#### Scenario: scanSetting 2 (Initial Preferred)
- **GIVEN** focus tile "a" and words ["apple", "banana", "cat", "bat"]
- **WHEN** scanSetting is 2
- **THEN** the game displays ["apple"] first, then ["banana", "bat"] (words containing "a" not in initial position)

#### Scenario: scanSetting 3 (All Positions)
- **GIVEN** focus tile "a" and words ["apple", "banana", "cat", "bat"]
- **WHEN** scanSetting is 3
- **THEN** the game displays ["apple", "banana", "cat", "bat"] (all words containing "a" anywhere)

### Requirement: Focus Tile Bolding

The game SHALL bold the focus tile within each word when `boldInitialFocusTiles` is enabled.

#### Scenario: Bolding enabled
- **GIVEN** focus tile "a", word "apple", and `boldInitialFocusTiles` is true
- **THEN** the word renders with the "a" tile in bold and remaining tiles in normal weight

#### Scenario: Bolding disabled
- **GIVEN** `boldInitialFocusTiles` is false
- **THEN** the word renders with uniform font weight for all tiles

### Requirement: Word-by-word navigation

The player advances through the word list one word at a time by tapping the word or a "Next" button.

#### Scenario: Advancing to next word
- **GIVEN** `wordIndex` is 0 and `wordsForTile` has 3 words
- **WHEN** `onNext()` is called
- **THEN** `wordIndex` becomes 1 and the next word is displayed

### Requirement: No scoring (NO_TRACKER_COUNTRY)

Romania MUST NOT call `shell.incrementPointsAndTracker` at any point. The shell handles progression without tracker increments.

#### Scenario: Tracker not called
- **WHEN** the player advances through any word
- **THEN** `shell.incrementPointsAndTracker` is never invoked

### Requirement: Precompute tile-to-word mapping

The game MUST register a precompute under key `'romania'` that builds a `Record<tileId, Word[]>` at boot time.

#### Scenario: Boot-time precomputation
- **WHEN** the app boots
- **THEN** `buildRomaniaData` is invoked once and words are indexed by tile

### Requirement: Container / Presenter split

`<RomaniaContainer>` SHALL own all hooks and logic. `<RomaniaScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit
- **WHEN** `RomaniaScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `usePrecompute`, or `useTranslation` calls
