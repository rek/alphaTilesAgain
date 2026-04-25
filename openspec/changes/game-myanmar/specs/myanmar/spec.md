# Capability: Myanmar Game (Word Search)

Myanmar is a 7×7 word-search. Up to 7 placed words must be located by selecting cells; allowed directions and selection method vary by `challengeLevel` and a settings key.

## Requirements

### R1. Grid and Word Constraints

- Grid MUST be 7×7 (49 cells).
- Up to 7 words MUST be placed; each word MUST have between 3 and 7 tiles.
- Words that fail to place within 100 attempts MUST be skipped; `completionGoal` MUST equal the number of placed words.
- All non-word cells MUST be filled with random tiles whose type is not vowel (`V`/`LV`/`AV`/`BV`/`FV`).

### R2. Direction Tiers by Challenge Level

- **CL1**: only `right` and `down`.
- **CL2**: CL1 directions + `down-right` and `up-right` (4 total).
- **CL3**: CL2 directions + `left`, `up`, `up-left`, `down-left` (8 total).

#### Scenario: CL1 cannot place words diagonally
- **GIVEN** challengeLevel=1
- **WHEN** the placement runs
- **THEN** every placed-word path MUST step exclusively `right` or `down`

### R3. Selection Methods

`Selection Method for Word Search` MUST be read from settings:
- **Method 1 (classic)**: tap a first cell, then a second cell. The straight-line span between them MUST be checked against placed paths. After the second tap, both selections reset (regardless of match outcome).
- **Method 2 (stack)**: each tap appends the cell index to a stack (max length 8). After each append, the ordered stack MUST be checked against placed paths. On match or stack cap, the stack resets.

### R4. Found-Word Highlight

When a placed-word path is matched:
- The cells in that path MUST be coloured using the next entry in the found-colour cycle.
- The matched word's text MUST be displayed in the active-word area.
- `wordsCompleted` MUST increment by 1.

### R5. Completion

When `wordsCompleted === completionGoal`, the game MUST:
- Set advance arrow to blue.
- Call `incrementPointsAndTracker(wordsCompleted)`.
- Play `playCorrectThenWord(true)` (celebration variant).
- Clear remaining image-bank slots.

### R6. Image Bank

There MUST be 7 image slots on the right of the grid corresponding to the placed words. Tapping a slot plays the word audio and shows its text in the active-word area. Slots are cleared after audio when the word has already been found.

### R7. Container / Presenter Split

`<MyanmarContainer>` SHALL own all state and hook usage. `<MyanmarScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
