## ADDED Requirements

### Requirement: Grid and Word Constraints

The Myanmar mechanic SHALL render a 7×7 grid (49 cells) and SHALL place up to 7 reference words on it. Each placed word's tile sequence SHALL contain between 3 and 7 tiles inclusive. Words that fail to place within 100 attempts SHALL be skipped, and `completionGoal` SHALL equal the number of placed words. All non-word cells SHALL be filled with random tiles whose `typeOfThisTileInstance` is not equal to the literal string `"V"` — `LV`/`AV`/`BV`/`FV` types are NOT excluded (Java `Myanmar.java` filter is preserved verbatim).

#### Scenario: Word too short is skipped
- **GIVEN** a candidate word whose parsed tile sequence has length 2
- **WHEN** placement runs
- **THEN** the word is not placed
- **AND** `completionGoal` does not include it

#### Scenario: Vowel tiles never appear in non-word cells
- **GIVEN** the placement grid has cells left null after word placement
- **WHEN** `fillRandomNonVowels` runs
- **THEN** no cell is filled with a tile whose `type === "V"`

### Requirement: Direction Tiers Mirror Java directions[] Array

The placement algorithm SHALL mirror the Java `directions[]` array verbatim (8 entries, indices 0–7) and the corresponding `maxDirections` values (CL1=1, CL2=4, CL3=7). The roll bound is INCLUSIVE: `wordD = floor(rng() * (maxDirections + 1))` selects from `[0, maxDirections]`. Boundary checks SHALL branch on the keypad code (NOT on dx/dy). The implementation SHALL preserve the idx-4 quirk where keypad code 9 carries dx=1, dy=0 (a duplicate of idx-1's right movement).

| idx | dx | dy | movement | keypad |
|---|---|---|---|---|
| 0 | 0 | 1 | down | 2 |
| 1 | 1 | 0 | right | 6 |
| 2 | -1 | 1 | down-left | 1 |
| 3 | 1 | 1 | down-right | 3 |
| 4 | 1 | 0 | right (Java BUG: keypad 9 carries dx=1,dy=0) | 9 |
| 5 | -1 | 0 | left | 4 |
| 6 | -1 | -1 | up-left | 7 |
| 7 | 0 | -1 | up | 8 |

Resulting unique movement sets:
- **CL1**: `right`, `down` (2 dirs).
- **CL2**: `right`, `down`, `down-left`, `down-right` (4 dirs; idx 4 duplicates idx 1).
- **CL3**: above + `left`, `up-left`, `up` (7 dirs; **`up-right` is NEVER picked** due to the idx-4 Java bug).

#### Scenario: CL1 cannot place words diagonally
- **GIVEN** challengeLevel=1
- **WHEN** the placement runs
- **THEN** every placed-word path steps exclusively `right` or `down`

#### Scenario: CL3 never picks up-right
- **GIVEN** challengeLevel=3
- **WHEN** placement runs across many seeds
- **THEN** no placed path steps `up-right` (dx=1, dy=-1)

### Requirement: Selection Method 1 (Classic Two-Tap)

When the `Selection Method for Word Search` setting resolves to `1`, the player SHALL select two endpoint cells. The straight-line span between them is checked against placed-word paths. After the second tap, both selections reset regardless of match outcome. Forward and reverse spans SHALL both match the placed word's path.

#### Scenario: Two-tap on horizontal word matches
- **GIVEN** Method 1 and a placed word at cells `[0,1,2,3]`
- **WHEN** the player taps cell 0 then cell 3
- **THEN** the word is marked found
- **AND** both selections reset

#### Scenario: Two-tap reverse direction also matches
- **GIVEN** Method 1 and a placed word at cells `[0,1,2,3]`
- **WHEN** the player taps cell 3 then cell 0
- **THEN** the word is still marked found

#### Scenario: Non-axis span resets without matching
- **GIVEN** Method 1
- **WHEN** the player taps two cells that are not on a horizontal, vertical, or 45° diagonal line
- **THEN** no word is marked found
- **AND** both selections reset

### Requirement: Selection Method 2 (Stack with Directional Continuity)

When the `Selection Method for Word Search` setting resolves to `2`, taps SHALL append cell indices to a stack of maximum length 8. After each append, the ordered stack SHALL be checked against placed-word paths. The first tap is unconstrained. The second tap MUST be 8-neighbour-adjacent to the first and SHALL establish a `direction` (normalized dx, dy ∈ {-1, 0, 1}). Every subsequent tap MUST be adjacent to the previous tap AND in the same `direction`; taps that violate continuity SHALL be ignored (no append, no reset). Re-tapping the most-recently-added cell SHALL pop it from the stack; popping below 2 cells SHALL clear `direction`. On match or stack cap, the stack and direction SHALL reset.

#### Scenario: Direction is established by 1st→2nd tap
- **GIVEN** Method 2 and an empty stack
- **WHEN** the player taps cell (0,0) then (1,1)
- **THEN** the stack is `[idx(0,0), idx(1,1)]`
- **AND** the established direction is `(1, 1)`

#### Scenario: 3rd tap that breaks direction is ignored
- **GIVEN** Method 2 with direction `(1, 0)` after taps (0,0) → (1,0)
- **WHEN** the player taps (2,1) (which is adjacent but down-right, not right)
- **THEN** the stack remains `[idx(0,0), idx(1,0)]`
- **AND** the direction remains `(1, 0)`

#### Scenario: Re-tap of last cell pops it
- **GIVEN** Method 2 with stack `[idx(0,0), idx(1,1), idx(2,2)]`
- **WHEN** the player taps (2,2) again
- **THEN** the stack becomes `[idx(0,0), idx(1,1)]`

### Requirement: Found-Word Highlight

When a placed-word path is matched, the cells in that path SHALL be coloured using the next entry in the found-colour cycle (drawn from `aa_colors.txt` `hexByIndex`, falling back to a 7-entry default palette if the pack provides fewer than 7 colours). The matched word's text SHALL be displayed in the active-word area. `wordsCompleted` SHALL increment by 1.

#### Scenario: Found word colours its path
- **WHEN** a placed word at cells `[0,1,2]` is matched
- **THEN** cells 0, 1, 2 receive the next palette colour
- **AND** the active-word area shows the word's `wordInLOP` text

### Requirement: Completion Behaviour

When `wordsCompleted === completionGoal`, the mechanic SHALL call `incrementPointsAndTracker(true)` and SHALL chain `playCorrect → replayWord` for the celebration audio. Image-bank slots for found words SHALL appear cleared.

#### Scenario: All words found triggers completion audio
- **WHEN** the last remaining placed word is found
- **THEN** `incrementPointsAndTracker(true)` fires once
- **AND** `playCorrect` plays followed by `replayWord`

### Requirement: Image Bank

There SHALL be one image slot per placed word (up to 7), shown to the right of the grid. Tapping a slot SHALL play the word's audio (`replayWord` after setting `refWord`) and SHALL show its text in the active-word area. Slots whose word has already been found SHALL render as "done" (cleared) and SHALL be unclickable.

#### Scenario: Tapping an unfound image plays its audio
- **GIVEN** a placed word whose image slot has not been cleared
- **WHEN** the player taps the slot
- **THEN** `setRefWord` is called with the word's `wordInLOP`/`wordInLWC`
- **AND** `replayWord` is invoked

### Requirement: Container / Presenter Split

`<MyanmarContainer>` SHALL own all state and hook usage (`useGameShell`, `useLangAssets`, `useAudio`, settings reads). `<MyanmarScreen>` SHALL be a pure props→JSX presenter with no hooks (apart from `useWindowDimensions` for sizing) and SHALL NOT import `react-i18next`.

#### Scenario: Presenter is hook-free
- **WHEN** `<MyanmarScreen>` is rendered
- **THEN** the rendered output is determined entirely by props
- **AND** the file does not import `react-i18next` or any hook from `@alphaTiles/feature-game-shell`

### Requirement: Selection Method Read From Settings

The `Selection Method for Word Search` value SHALL be read from `aa_settings.txt` via `assets.settings.findInt('Selection Method for Word Search', 1)`. Values other than `1` or `2` SHALL fall back to `1`.
