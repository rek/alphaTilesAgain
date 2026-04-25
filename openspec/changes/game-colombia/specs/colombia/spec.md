# Capability: Colombia Game (Build the Word)

Colombia is a tile-keyboard word builder. The player taps tiles to spell the active word; live colour feedback indicates whether the partial spelling is on track, wrong, or overlong; matching the full word wins.

## Requirements

### R1. Keyboard Composition by Variant + Challenge Level

The keyboard MUST be built per (`syllableGame`, `challengeLevel`):

| variant | CL | Keyboard contents |
|---|---|---|
| T | 1 | shuffled unique tiles of the active word |
| T | 2 | active-word tiles + 1 distractor per tile, shuffled |
| T | 3 | full `aa_keyboard.txt` keys |
| T | 4 | dedup `tileList`, type-coloured |
| S | 1 | shuffled unique syllables of active word |
| S | 2 | active-word syllables + 1 distractor per syllable, shuffled |
| S | 3 | all syllables |
| S | 4 | unsupported (return to country menu) |

#### Scenario: T-CL1 keyboard contains exactly the word's tiles
- **GIVEN** syllableGame="T", challengeLevel=1, and the active word parses to ["a","b","c"]
- **WHEN** the round starts
- **THEN** the keyboard has exactly 3 tiles whose texts are {"a","b","c"} in shuffled order

### R2. Live Attempt Feedback

The active-word display MUST shade based on `currentAttempt`:
- **Yellow** — every keyed tile matches the same-index target tile, attempt length < target length.
- **Orange** — at least one keyed tile diverges from the same-index target tile.
- **Gray** — attempt length exceeds target length.
- **Default** — attempt is empty.

#### Scenario: Yellow while building correctly
- **GIVEN** target = ["c","a","t"] and attempt = ["c","a"]
- **WHEN** the player keys "a" as the second tile
- **THEN** the active-word background is yellow

#### Scenario: Orange after a wrong tile
- **GIVEN** target = ["c","a","t"] and attempt = ["c","x"]
- **WHEN** the wrong tile is keyed
- **THEN** the active-word background is orange

#### Scenario: Gray when overlong
- **GIVEN** target = ["c","a","t"] and attempt = ["c","a","t","s"]
- **WHEN** an extra tile is keyed
- **THEN** the active-word background is gray

### R3. Win Condition

When `attempt` matches `target` exactly (same length, every position equal), the game MUST:
- Call `incrementPointsAndTracker(4)`.
- Play correct sound followed by the active word clip.
- Set advance arrow to blue and lock further key presses until `onPlayAgain`.

### R4. Delete Button

Tapping delete MUST remove the last entry from `attempt` and recompute the colour status.

### R5. Pagination

When the keyboard exceeds one page (T-CL3 with > 35 keys uses 33/page; S-CL3 uses 18/page), prev/next arrows MUST be visible. They MUST be hidden at the first/last page respectively. CL1/CL2 MUST never paginate.

### R6. S-CL4 Unsupported

When `syllableGame === "S"` and `challengeLevel === 4`, the game MUST return immediately to the country menu and MUST NOT render its UI.

### R7. Container / Presenter Split

`<ColombiaContainer>` SHALL own all state and hook usage. `<ColombiaScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
