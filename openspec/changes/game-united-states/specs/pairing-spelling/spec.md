## United States Game (Pairing/Spelling) Spec

## ADDED Requirements

### Requirement: Board setup with tile pairs and distractors

The United States mechanic SHALL render a grid of N pairs of tiles (where N is the target word's tile length). Each pair consists of a "top" tile and a "bottom" tile. One tile in each pair is the correct tile from the target word at that position; the other is a distractor randomly selected from that tile's alternatives in the language pack. This ports `UnitedStates.java:132–175 onCreate`.

#### Scenario: Round initialization
- **WHEN** `<UnitedStatesContainer>` starts a round
- **THEN** it selects a word matching the `challengeLevel` length constraints
- **AND** it generates N pairs of tiles, each containing one correct tile and one distractor
- **AND** the correct tile's position (top or bottom) is randomized for each pair

### Requirement: Challenge-level scales word length
The mechanic SHALL select words based on `challengeLevel`:
- Level 1: word length 2 to 5 tiles.
- Level 2: word length 2 to 7 tiles.
- Level 3: word length 2 to 9 tiles.
This ports `UnitedStates.java:70–88 onCreate`.

#### Scenario: Level 1 word selection
- **WHEN** `challengeLevel` is 1
- **THEN** only words with 2 to 5 tiles are selected for the round.

### Requirement: Tile selection and word building
The mechanic SHALL allow the user to select one tile from each pair. Selecting a tile updates the "constructed word" display. Selecting the other tile in the same pair SHALL replace the previous selection. This ports `UnitedStates.java:319–346 onBtnClick`.

#### Scenario: Selecting a tile
- **WHEN** a user taps a tile in a pair
- **THEN** that tile becomes "selected" (changes color)
- **AND** the other tile in that same pair becomes "unselected" (returns to dark gray)
- **AND** the constructed word display updates at the corresponding position

### Requirement: Constructed word display
The mechanic SHALL render the constructed word, showing underscores (`_` or `__`) for positions where no tile has been selected yet. This ports `UnitedStates.java:176–181 onCreate` and `251–284 buildWord`.

#### Scenario: Partial selection
- **WHEN** the word is "cat" and the user has selected 'c' for the first pair but nothing for the rest
- **THEN** the word display shows "c _ _" (or equivalent based on script)

### Requirement: Win condition
The mechanic SHALL check the constructed word against the target word whenever a selection is made. A win is triggered when all positions have a selection and the resulting word matches the target word. This ports `UnitedStates.java:285–302 buildWord`.

#### Scenario: Winning the round
- **WHEN** the player selects the last correct tile to complete the target word
- **THEN** `shell.incrementPointsAndTracker(2)` is invoked
- **AND** `shell.playCorrectFinal()` (or active word audio) is played
- **AND** interaction is locked until the next round starts

### Requirement: Precompute for word filtering
The mechanic SHALL register a precompute via `util-precompute` under the key `'united-states'` that buckets the pack's `wordList` by tile length.

#### Scenario: Boot-time precomputation
- **WHEN** the app boots
- **THEN** `buildUnitedStatesData` is invoked once and the bucketed word list is cached

### Requirement: Container/presenter split
`<UnitedStatesContainer>` SHALL own all hook usage (i18n, precompute, shell context, state). `<UnitedStatesScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit
- **WHEN** `UnitedStatesScreen.tsx` is inspected
- **THEN** it contains no `useTranslation` or `useGameShell` calls; all data and callbacks are passed as props
