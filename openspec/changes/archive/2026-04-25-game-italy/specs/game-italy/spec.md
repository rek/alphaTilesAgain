# Capability: Italy Game (Lotería)

Italy is a Lotería-style 4×4 word-bingo. A caller advances through a shuffled deck; the player taps the matching tile on the board to drop a bean; first row, column, or diagonal of 4 beans wins.

## Requirements

### R1. Setup

- `deckSize` MUST be read from settings key `Italy Deck Size` (default `54`).
- The source list MUST be `wordList` when `syllableGame === "T"` and `syllableList` when `syllableGame === "S"`.
- If the source list has fewer than `deckSize` entries, the game MUST navigate back to the country menu and not render.
- The first 16 entries of an initial shuffle MUST be placed on a 4×4 board (`CARDS_ON_BOARD === 16`).
- The full `deckSize` slice MUST be re-shuffled to form the caller deck.

### R2. Caller Advance

`onAdvance` MUST advance `deckIndex` by 1 and play the new current call's audio.

#### Scenario: Advance plays the next word
- **GIVEN** the deck is at `deckIndex = 2`
- **WHEN** the user presses advance
- **THEN** `deckIndex` becomes `3`
- **AND** the audio for `deck[3]` plays

### R3. Correct Match Drops a Bean

When the player taps the board cell whose text equals the current call text, the cell MUST be covered with a bean. After cover, the game MUST check for a win.

### R4. Win Detection

A win occurs when any of the 10 winning sequences (4 rows, 4 columns, 2 diagonals) is fully covered. On win, the game MUST:
- Mark each cell in the winning sequence as `loteria` (rendered with `zz_bean_loteria.png`).
- Set advance arrow to blue.
- Play `playCorrectThenWord(true)` (lotería celebration variant).
- Call `incrementPointsAndTracker(4)`.

#### Scenario: Lotería on a diagonal
- **GIVEN** beans cover board indices [0, 5, 10, 15]
- **WHEN** the win check runs
- **THEN** those four cells are marked `loteria` and points awarded

### R5. Correct But Not Yet Lotería

If a tap matches but no winning sequence is yet complete, the game MUST play `playCorrectThenWord(false)` and auto-advance the caller.

### R6. Wrong Tap

If the player taps a cell whose text does not equal the current call, the game MUST play the incorrect sound and take no other action.

### R7. Deck Exhaustion

When `deckIndex` reaches the last deck position without a lotería, the game MUST play the incorrect sound twice and then reset (re-shuffle, rebuild board, clear beans, reset `deckIndex`).

### R8. Variants

- T variant: tile text = `wordInLOP`; image = variant-2 word image; audio = word clip.
- S variant: tile text = syllable text; image = syllable image when present; audio = syllable clip.

### R9. Container / Presenter Split

`<ItalyContainer>` SHALL own all state and hook usage. `<ItalyScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
