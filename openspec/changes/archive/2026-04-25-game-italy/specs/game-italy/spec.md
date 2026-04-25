# Capability: game-italy

Italy is a Lotería-style 4×4 word-bingo game. A caller advances through a shuffled deck; the player taps the matching tile on the board to drop a bean; first row, column, or diagonal of 4 beans wins.

## ADDED Requirements

### Requirement: Setup

The game SHALL build a fresh round on mount and on every reset.

- `deckSize` MUST be read from settings key `Italy Deck Size` (default `54`); values below `CARDS_ON_BOARD` (16) MUST be clamped up to 16 (Italy.java:115-118).
- The source list MUST be `wordList` when `syllableGame === "T"` and `syllableList` when `syllableGame === "S"`.
- If the source list has fewer than `deckSize` entries, the game MUST navigate back to the country menu (`router.replace('/earth')`) and not render gameplay.
- The source MUST be shuffled, sliced to `deckSize` (`gameCards`), and the first 16 entries MUST be placed on a 4×4 board (`CARDS_ON_BOARD === 16`) in shuffle order.
- The full `gameCards` slice MUST then be re-shuffled to form the caller deck (`deckIndex` starts at `0`).

#### Scenario: Setup with sufficient content
- **GIVEN** `wordList.length >= 54` and `syllableGame === "T"`
- **WHEN** the round starts
- **THEN** the board has 16 cells and the deck has 54 entries
- **AND** every board cell appears in the deck

#### Scenario: Setup with insufficient content
- **GIVEN** `wordList.length < 54`
- **WHEN** the round starts
- **THEN** the game navigates to `/earth` and renders no board

### Requirement: Caller Advance

The shell's advance arrow SHALL forward the caller. While `won === false`, advancing increments `deckIndex` by 1 and plays the new current call's audio.

#### Scenario: Advance plays the next call
- **GIVEN** the deck is at `deckIndex = 2` and not yet won
- **WHEN** the user presses advance
- **THEN** `deckIndex` becomes `3`
- **AND** the audio for `deck[3]` plays

### Requirement: Correct Match Drops a Bean

When the player taps the board cell whose text equals the current call text, the cell MUST be marked covered. After the cell is covered, the win check MUST run.

#### Scenario: Tap a matching cell
- **GIVEN** the current call is "fish" and board cell 6 has text "fish" and is uncovered
- **WHEN** the player taps cell 6
- **THEN** cell 6 is marked covered
- **AND** the bean / lotería overlay is rendered on cell 6

### Requirement: Win Detection

A win occurs when any of the 10 winning sequences (4 rows + 4 columns + 2 diagonals — see `WIN_SEQUENCES`) is fully covered. On win, the game MUST mark each cell in the winning sequence as `loteria`, advance arrow turns blue (handled by shell `repeatLocked = false`), play `playCorrect()` then the active word/syllable clip, and award `incrementPointsAndTracker(true, 4)`.

#### Scenario: Lotería on a diagonal
- **GIVEN** beans cover board indices `[0, 5, 10, 15]`
- **WHEN** the win check runs
- **THEN** those four cells are marked `loteria`
- **AND** `incrementPointsAndTracker(true, 4)` fires once

#### Scenario: Lotería on a row
- **GIVEN** beans cover board indices `[4, 5, 6, 7]`
- **WHEN** the win check runs
- **THEN** those four cells are marked `loteria`
- **AND** `incrementPointsAndTracker(true, 4)` fires once

### Requirement: Correct But Not Yet Lotería

If a tap matches but no winning sequence is yet complete, the game MUST play `playCorrect()` followed by the active call audio, and auto-advance the caller after a brief pause (`ADVANCE_DELAY_MS = 800` ms) so the chime is audible before the next call starts.

#### Scenario: Cover without winning
- **GIVEN** the board has 0 covered cells and the player taps the matching cell at index 5
- **WHEN** the tap resolves
- **THEN** cell 5 is covered and `won === false`
- **AND** after 800 ms the caller advances by one

### Requirement: Wrong Tap

If the player taps a cell whose text does not equal the current call, the game MUST play the incorrect sound and take no other action — no cover, no caller advance, no score change.

### Requirement: Deck Exhaustion

When `deckIndex` reaches the last deck position without a lotería and the caller is advanced, the game MUST play the incorrect sound twice and then reset (re-shuffle, rebuild board, clear beans, reset `deckIndex`).

#### Scenario: Advance past last call without winning
- **GIVEN** `deckIndex === deck.length - 1` and `won === false`
- **WHEN** the user presses advance
- **THEN** `playIncorrect()` fires twice
- **AND** the round resets

### Requirement: Variants

The game SHALL support two variants driven by the `syllableGame` route param.

- T variant (`syllableGame === "T"`): cell text = `wordInLOP`; cell image = variant-2 word image (`assets.images.wordsAlt[wordInLWC]`); audio = `playWord(wordInLWC)`.
- S variant (`syllableGame === "S"`): cell text = `syllable.syllable`; cell image = undefined (Java has no syllable image lookup); audio = `playSyllable(syllable.audioName)`.

The repeat button MUST replay the current call's audio in both variants. Because the shell's default `replayWord` only plays words, the container SHALL register an `onRepeat` handler via `setOnRepeat` so the S variant plays a syllable clip rather than a non-existent word clip.

### Requirement: Reset After Lotería

Once a lotería is registered, the next press of the advance arrow MUST start a fresh round (re-shuffle, rebuild board, clear beans, reset `deckIndex` and `won`).

### Requirement: Container / Presenter Split

`<ItalyContainer>` SHALL own all hooks (game shell, language assets, audio, router, i18n) and all state (`board`, `deck`, `deckIndex`, `won`, `insufficient`). `<ItalyScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
