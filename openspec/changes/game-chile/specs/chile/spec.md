# Capability: Chile Game (Phonemic Wordle)

Chile is a tile-based Wordle clone where players guess a secret word using the language pack's phonemic tile alphabet. Tile feedback (GREEN/BLUE/GRAY) guides the player to the correct word.

## Requirements

### R1. Guess Row Count Scales with Challenge Level

The number of available guess rows MUST equal `baseGuessCount - challengeLevel + 1` (default `baseGuessCount = 8`).

#### Scenario: Level 1 has 8 rows
- **GIVEN** challengeLevel is 1 and baseGuessCount is 8
- **WHEN** a game starts
- **THEN** 8 guess rows are displayed

#### Scenario: Level 3 has 6 rows
- **GIVEN** challengeLevel is 3 and baseGuessCount is 8
- **WHEN** a game starts
- **THEN** 6 guess rows are displayed

### R2. Tile Feedback — Correct Position (GREEN)

A guessed tile in the exact correct position MUST be colored GREEN.

#### Scenario: Exact match
- **GIVEN** secret is ["c", "a", "t"] and guess is ["c", "a", "t"]
- **WHEN** the guess is submitted
- **THEN** all three tiles are GREEN

### R3. Tile Feedback — Correct Tile, Wrong Position (BLUE)

A guessed tile that exists in the secret word but is in the wrong position MUST be colored BLUE (if not already accounted for by a GREEN match).

#### Scenario: Tile in word but wrong position
- **GIVEN** secret is ["c", "a", "t"] and guess is ["a", "c", "t"]
- **WHEN** the guess is submitted
- **THEN** "a" at position 0 is BLUE, "c" at position 1 is BLUE, "t" at position 2 is GREEN

### R4. Tile Feedback — Not in Word (GRAY)

A guessed tile that does not appear in the secret word MUST be colored GRAY.

#### Scenario: Tile not in word
- **GIVEN** secret is ["c", "a", "t"] and guess is ["d", "o", "g"]
- **WHEN** the guess is submitted
- **THEN** all three tiles are GRAY

### R5. Keyboard Color Update

After each guess, each keyboard tile's color MUST update to reflect the best-known feedback (GREEN > BLUE > GRAY). A tile's color never regresses to a lower certainty.

#### Scenario: Keyboard reflects best result
- **GIVEN** "a" was BLUE in a prior guess
- **WHEN** a new guess places "a" in the correct position (GREEN)
- **THEN** the "a" keyboard key updates to GREEN

### R6. Win Condition

When all tiles in a guess row are GREEN, the game MUST call `updatePointsAndTrackers(1)` and show the reset button.

#### Scenario: Winning guess
- **GIVEN** the secret is ["ba", "na", "na"] and the player guesses ["ba", "na", "na"]
- **WHEN** the guess is submitted
- **THEN** all tiles are GREEN
- **AND** `updatePointsAndTrackers(1)` is called

### R7. Lose Condition

When the player exhausts all guess rows without a full GREEN row, the secret word MUST be revealed (tiles shown in GREEN below the grid). No points awarded.

#### Scenario: All rows used, no win
- **GIVEN** the player has used all available guess rows without a full-GREEN row
- **WHEN** the final guess is submitted
- **THEN** the correct answer is shown in GREEN
- **AND** `updatePointsAndTrackers` is NOT called

### R8. Precompute: Word List and Keyboard

The game MUST register a precompute under key `'chile'` that:
- Filters `wordList` to words with tile count between `minWordLength` (default 3) and `maxWordLength` (default 100).
- Builds a keyboard of up to 50 unique tiles from valid words, sorted by `tileList` order.

#### Scenario: Boot-time precomputation
- **WHEN** the app boots
- **THEN** `chilePreProcess` runs once and the word list and keyboard are cached

### R9. Container / Presenter split

`<ChileContainer>` SHALL own all state and hook usage. `<ChileScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit
- **WHEN** `ChileScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `usePrecompute`, or `useTranslation` calls
