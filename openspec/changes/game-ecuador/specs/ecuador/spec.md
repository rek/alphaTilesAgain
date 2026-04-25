# Capability: Ecuador Game (Scatter Word Match)

Ecuador is a word-image matching game with a scattered tile layout. The player sees a prompt (word + image) and 8 randomly-positioned word tiles, and must tap the tile whose text matches the prompt.

## Requirements

### R1. Round Composition

Each round MUST display exactly 8 word tiles. One tile's text MUST equal the prompt word's stripped `wordInLOP`. The other 7 tiles MUST be distinct words drawn from `cumulativeStageBasedWordList`.

#### Scenario: Round contains the correct word among 8 tiles
- **GIVEN** the prompt word is "cat"
- **WHEN** the round is composed
- **THEN** there are exactly 8 tiles
- **AND** exactly one tile's text equals "cat"
- **AND** the other 7 tile texts are distinct and ≠ "cat"

### R2. Non-Overlapping Placement

Tiles MUST be placed at random positions and widths such that no two tiles overlap. Placement MAY retry up to 10 000 attempts per tile; if placement fails, the entire round MUST be re-placed.

#### Scenario: Tile rectangles do not overlap
- **GIVEN** 8 tiles placed by the algorithm
- **WHEN** any two tile rectangles are compared
- **THEN** their bounding boxes do not intersect

### R3. Correct Answer

When the player taps a tile whose text equals the stripped `prompt.wordInLOP`, the game MUST:
- Call `incrementPointsAndTracker(2)`.
- Play correct sound followed by the active word clip.
- Gray out the 7 non-correct tiles.
- Set advance arrow to blue.

### R4. Wrong Answer

When the player taps a non-correct tile, the game MUST play the incorrect sound and track the wrong answer. The tile remains tappable for retry until correct.

### R5. No Challenge Level / Syllable Variation

The mechanic MUST NOT vary with `challengeLevel` or `syllableGame`. There is no precompute, no syllable mode.

### R6. Container / Presenter Split

`<EcuadorContainer>` SHALL own all state and hook usage. `<EcuadorScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
