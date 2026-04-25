# Chile Identification Game Specification

## Requirements

### Requirement: Matching image to word

The game SHALL present a word image and four word choices, exactly one of which corresponds to the image.

#### Scenario: Selection of correct word
- **GIVEN** image for "apple" and choices ["apple", "banana", "cat", "bat"]
- **WHEN** user selects "apple"
- **THEN** `shell.incrementPointsAndTracker(1)` is called and round is won

#### Scenario: Selection of incorrect word
- **GIVEN** image for "apple" and choices ["apple", "banana", "cat", "bat"]
- **WHEN** user selects "banana"
- **THEN** `shell.playIncorrect()` is called and that choice is visually disabled

### Requirement: Distractor uniqueness

The three distractor words MUST all be distinct from each other and from the correct word.

#### Scenario: Distractors are unique
- **GIVEN** a word pool containing at least 4 words
- **WHEN** a round is set up
- **THEN** all 4 choices are distinct words

### Requirement: Choices are shuffled

The correct word's position among the four choices MUST be randomized each round.

#### Scenario: Correct word position varies
- **GIVEN** multiple rounds played in sequence
- **WHEN** each round is set up
- **THEN** the correct word does not always appear in the same slot

### Requirement: Audio prompt on round start

The game MUST play the `refWord`'s audio at the start of each round so the player hears the word they are matching.

#### Scenario: Audio plays on new round
- **WHEN** a new round starts
- **THEN** `shell.replayWord(refWord)` is called immediately

### Requirement: Container / Presenter split

`<ChileContainer>` SHALL own all hooks and logic. `<ChileScreen>` SHALL be a pure props→JSX presenter with no hook imports.

#### Scenario: Presenter audit
- **WHEN** `ChileScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `useLangAssets`, or `useTranslation` calls
