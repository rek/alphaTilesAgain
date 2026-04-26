## ADDED Requirements

### Requirement: Guess Row Count Scales With Challenge Level

The number of available guess rows SHALL equal `baseGuessCount - challengeLevel + 1` (default `baseGuessCount = 8`, settable via `Chile base guess count`). Java reference: `Chile.java:91`.

#### Scenario: Level 1 has 8 rows

- **GIVEN** `challengeLevel = 1` and `baseGuessCount = 8`
- **WHEN** a Chile round starts
- **THEN** the guess grid renders 8 rows of `secret.length` cells

#### Scenario: Level 3 has 6 rows

- **GIVEN** `challengeLevel = 3` and `baseGuessCount = 8`
- **WHEN** a Chile round starts
- **THEN** the guess grid renders 6 rows

### Requirement: Two-Pass Tile Feedback

On submit, the game SHALL score the current guess row using a two-pass algorithm matching `Chile.java:205–221`:

- Pass 1: every guess cell whose text equals `secret[i]` MUST be marked GREEN, and `frontCor[i]` MUST be set true.
- Pass 2: for every non-green guess cell at index `i`, the algorithm SHALL scan guess positions `x` for the first `x` where `row[x] === secret[i]` AND `row[x] !== secret[x]` AND `!frontCor[i]` AND `correct[x] === 0`; if found it MUST set `frontCor[i] = true` and `correct[x] = 2` (BLUE) at the **guess slot `x`**.
- Cells with `correct === 0` MUST render GRAY.

Color values: GREEN = `colorList[3]`, BLUE = `colorList[1]`, GRAY = `colorList[8]`.

#### Scenario: Exact match all green

- **GIVEN** `secret = ["c","a","t"]` and guess `["c","a","t"]`
- **WHEN** the guess is submitted
- **THEN** all 3 cells are GREEN

#### Scenario: BLUE at guess-slot of duplicate

- **GIVEN** `secret = ["c","a","t"]` and guess `["a","c","t"]`
- **WHEN** the guess is submitted
- **THEN** cell at index 0 is BLUE, cell at index 1 is BLUE, cell at index 2 is GREEN

#### Scenario: Tile not in word is gray

- **GIVEN** `secret = ["c","a","t"]` and guess `["d","o","g"]`
- **WHEN** the guess is submitted
- **THEN** all 3 cells are GRAY

#### Scenario: Duplicate guess letter scored once

- **GIVEN** `secret = ["c","a","t"]` and guess `["a","a","t"]`
- **WHEN** the guess is submitted
- **THEN** cell 0 is BLUE (claims `secret[1]`), cell 1 is GRAY (already claimed), cell 2 is GREEN

### Requirement: Keyboard Color Promotion

After each guess is scored, every keyboard key whose text matches a just-scored guess cell SHALL update color following promotion rules from `Chile.java:250–258`:

- A key at `KEY_COLOR` MAY transition to GRAY, BLUE, or GREEN.
- A key at GRAY MAY transition to BLUE or GREEN.
- A key at BLUE MAY transition only to GREEN.
- A key at GREEN MUST NOT change.

#### Scenario: Key promotes BLUE → GREEN

- **GIVEN** key `"a"` is BLUE from a prior guess
- **WHEN** a new guess places `"a"` at the correct position (GREEN)
- **THEN** the keyboard key `"a"` becomes GREEN

#### Scenario: Key never regresses

- **GIVEN** key `"a"` is GREEN
- **WHEN** a later guess places `"a"` at a wrong position
- **THEN** the keyboard key `"a"` remains GREEN

### Requirement: Submit Guarded By Full Row

The submit handler SHALL return early without scoring or sound effects when any cell of the current row is empty. Java reference: `Chile.java:195–198`.

#### Scenario: Submit with empty cell is a no-op

- **GIVEN** `secret.length === 3` and the current row contains `["c","",""]`
- **WHEN** the player taps submit
- **THEN** no scoring runs, no sound plays, and `currentRow` does not advance

### Requirement: Win Condition

When `greenCount === secret.length` and the game was not previously finished, the game SHALL:

- Set `finished = true`.
- Play the correct sound.
- Call `updatePointsAndTrackers(1)` (i.e. `shell.incrementPointsAndTracker(true)`).
- Reveal the reset (repeat) button and hide the complete-word button.
- Call `setAdvanceArrowToBlue()` and `setOptionsRowClickable()`.

Java reference: `Chile.java:261–283`.

#### Scenario: Winning guess scores

- **GIVEN** `secret = ["ba","na","na"]` and the guess matches it exactly
- **WHEN** the guess is submitted
- **THEN** all 3 cells are GREEN, the correct sound plays, and `incrementPointsAndTracker(true)` is invoked once

### Requirement: Lose Condition

When the player submits the final available row without winning, the game SHALL:

- Set `finished = true`.
- Append `secret.length` extra reveal tiles with background GREEN and text color YELLOW (= `colorList[5]`) to the displayed tile list.
- Scroll to the appended reveal row.
- Play the incorrect sound.
- NOT call `updatePointsAndTrackers`.
- Reveal the reset button, hide the complete-word button, call `setAdvanceArrowToBlue()` and `setOptionsRowClickable()`.

Java reference: `Chile.java:266–274`.

#### Scenario: All rows used, no win

- **GIVEN** the player has used all available guess rows without a full-GREEN row
- **WHEN** the final guess is submitted
- **THEN** the secret tiles are appended with GREEN bg and YELLOW text and the incorrect sound plays
- **AND** `updatePointsAndTrackers` is NOT called

### Requirement: Backspace Clears Last Filled Cell In Current Row

The backspace handler SHALL iterate the current row right-to-left and clear the rightmost non-empty cell. It SHALL be a no-op when `finished === true`. Java reference: `Chile.java:150–159`.

#### Scenario: Backspace mid-row

- **GIVEN** the current row contains `["a","b",""]`
- **WHEN** the player taps backspace
- **THEN** the row becomes `["a","",""]`

#### Scenario: Backspace ignored after finish

- **GIVEN** `finished === true`
- **WHEN** the player taps backspace
- **THEN** the row is unchanged

### Requirement: Key Press Fills First Empty Cell

The key press handler SHALL iterate the current row left-to-right and fill the first empty cell with the tapped tile's text, then break. Java reference: `Chile.java:286–301`.

#### Scenario: Key fills next empty slot

- **GIVEN** the current row contains `["a","",""]`
- **WHEN** the player taps key `"b"`
- **THEN** the row becomes `["a","b",""]`

### Requirement: Reset Picks New Secret

The reset handler SHALL be a no-op when `!finished`. When `finished`, it SHALL:

- Reset every keyboard key's color to `KEY_COLOR` (= `colorList[0]`).
- Reset `currentRow = 0` and `finished = false`.
- Pop the next secret from the remaining word list.
- Refill (deep-copy from `data.words`) and Fisher-Yates shuffle the remaining list when it is empty.
- Re-init the guess tiles to `data.guesses × secret.length` empty cells.
- Hide the repeat button, show the complete-word button, call `setAdvanceArrowToGray()`.

Java reference: `Chile.java:160–187`.

#### Scenario: Reset before finish is ignored

- **GIVEN** `finished === false`
- **WHEN** the player taps reset
- **THEN** state is unchanged

#### Scenario: Reset refills exhausted word list

- **GIVEN** `finished === true` and the remaining-word list is empty
- **WHEN** the player taps reset
- **THEN** the remaining-word list is refilled from `data.words`, Fisher-Yates shuffled, and a new secret is popped

### Requirement: Precompute Word List And Keyboard

The mechanic SHALL register a precompute under key `'chile'` that, matching `Chile.java:302–369`:

- Reads settings `Chile keyboard width` (default 7), `Chile base guess count` (default 8), `Chile minimum word length` (default 3), `Chile maximum word length` (default 100). Each parse failure falls back silently to the default.
- Filters `Start.wordList` to words whose tile-parse length is in `[minWordLength, maxWordLength]`.
- Builds a unique-tile keyboard with at most 50 entries, in word-list order. When a word would introduce a tile beyond the cap, that word MUST be removed from the filtered list.
- Sorts the keyboard tiles by each tile's index in `Start.tileList`.
- Computes `fontScale = Util.getMinFontSize(keys)`.
- Returns `{ words, keys, keyboardWidth, fontScale }`. `guesses` is NOT precomputed.

#### Scenario: Boot-time precomputation

- **WHEN** the app boots
- **THEN** `chilePreProcess` runs once and the result is cached under key `'chile'`

#### Scenario: 50-tile keyboard cap drops over-budget words

- **GIVEN** the filtered word list has 60 unique tiles across 100 words
- **WHEN** `chilePreProcess` runs
- **THEN** the keyboard contains exactly 50 tiles and any word that would have introduced tile 51+ is dropped from the returned `words`

### Requirement: RTL Icon Flip

When `scriptDirection === 'RTL'`, the backspace and repeat icons SHALL render mirrored (`scaleX = -1`). Java reference: `Chile.java:87–90`.

#### Scenario: RTL flips icons

- **GIVEN** `scriptDirection === 'RTL'`
- **WHEN** `<ChileScreen>` renders
- **THEN** backspace and repeat icons render mirrored

### Requirement: Container / Presenter Split

`<ChileContainer>` SHALL own all state and hook usage. `<ChileScreen>` SHALL be a pure props→JSX presenter with no `useGameShell`, no `usePrecompute`, and no `react-i18next` import.

#### Scenario: Presenter audit

- **WHEN** `ChileScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`, `useGameShell`, or `usePrecompute`
