# Capability: Myanmar Game (Word Search)

Myanmar is a 7×7 word-search. Up to 7 placed words must be located by selecting cells; allowed directions and selection method vary by `challengeLevel` and a settings key.

## Requirements

### R1. Grid and Word Constraints

- Grid MUST be 7×7 (49 cells).
- Up to 7 words MUST be placed; each word MUST have between 3 and 7 tiles.
- Words that fail to place within 100 attempts MUST be skipped; `completionGoal` MUST equal the number of placed words.
- All non-word cells MUST be filled with random tiles whose `typeOfThisTileInstance` is not equal to `"V"`. (Java check: only the literal string `"V"` is excluded — `LV`/`AV`/`BV`/`FV` types are NOT excluded.)

### R2. Direction Tiers by Challenge Level

The placement algorithm MUST mirror the Java `directions[]` array verbatim (8 entries, indices 0–7) and the corresponding `maxDirections` values:

```
idx 0: ( 0,  1)  right
idx 1: ( 1,  0)  down
idx 2: (-1,  1)  down-left      // Java keypad code 1, dx=-1, dy=1
idx 3: ( 1,  1)  down-right
idx 4: ( 1,  0)  right          // Java BUG: keypad code 9 but dx=1, dy=0 — duplicate of idx 1's movement
idx 5: (-1,  0)  left
idx 6: (-1, -1)  up-left
idx 7: ( 0, -1)  up
```

(Tuples are `(dx, dy)`. `dy>0` = down, `dx<0` = left.)

- **CL1** (`maxDirections=1`): pick `wordD ∈ [0,1]` → `right` or `down`.
- **CL2** (`maxDirections=4`): pick `wordD ∈ [0,4]` → unique movement set is `{right, down, down-left, down-right}` (4 dirs; idx 4 is a duplicate of idx 0/1's right).
- **CL3** (`maxDirections=7`): pick `wordD ∈ [0,7]` → unique movement set is `{right, down, down-left, down-right, left, up-left, up}` (7 dirs; **`up-right` is NEVER picked** because of the idx-4 Java bug).

The implementation MUST preserve the idx-4 quirk — index 4 is rolled with the same probability as the others, even though it duplicates idx 1's movement. (See design.md D3 for the rationale: ports do not silently fix upstream bugs.)

#### Scenario: CL1 cannot place words diagonally
- **GIVEN** challengeLevel=1
- **WHEN** the placement runs
- **THEN** every placed-word path MUST step exclusively `right` or `down`

#### Scenario: CL3 never picks up-right
- **GIVEN** challengeLevel=3
- **WHEN** placement runs across many seeds
- **THEN** no placed path MUST step `up-right` (dx=1, dy=-1)

### R3. Selection Methods

`Selection Method for Word Search` MUST be read from settings:
- **Method 1 (classic)**: tap a first cell, then a second cell. The straight-line span between them MUST be checked against placed paths. After the second tap, both selections reset (regardless of match outcome).
- **Method 2 (stack)**: each tap appends the cell index to a stack (max length 8). After each append, the ordered stack MUST be checked against placed paths. On match or stack cap, the stack resets.
  - **Directional continuity (Java `respondToTileSelection2`)**: the first tap is unconstrained; the second tap MUST be adjacent (8-neighbour) to the first and establishes a `direction`. Every subsequent tap (3rd onwards) MUST be adjacent to the previous tap AND in the same `direction`. Taps that violate continuity MUST be ignored (no append, no reset).
  - Tapping the most-recently-added cell again MUST pop it from the stack (un-select).

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
