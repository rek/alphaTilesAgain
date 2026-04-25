# Capability: Japan Game (Syllable Segmentation)

Japan is a tile-linking game where players group a word's tiles into their correct syllable units by tapping link buttons between adjacent tiles.

## Requirements

### R1. Tiles Are Displayed with Link Buttons Between Them

The game MUST render the word's tiles in order with a clickable link button between each adjacent pair of tiles.

#### Scenario: Initial board state
- **GIVEN** a word parsed into tiles ["ba", "na", "na"]
- **WHEN** the round starts
- **THEN** 3 tile boxes are shown with 2 link buttons between them
- **AND** all link buttons are visible and tappable

### R2. Tapping a Link Button Joins Adjacent Tiles

Tapping a link button MUST merge the tiles on either side into one group and hide the link button.

#### Scenario: Joining tiles
- **GIVEN** tiles ["ba", "na", "na"] with link buttons between each
- **WHEN** user taps the link button between "ba" and "na" (first boundary)
- **THEN** "ba" and "na" merge into one group
- **AND** the link button between them disappears

### R3. Tapping a Joined Tile Separates It

Tapping a tile that is part of a joined group MUST split that group back into individual tiles (restoring link buttons on either side).

#### Scenario: Separating a joined group
- **GIVEN** "ba"+"na" are joined into one group
- **WHEN** user taps the "ba"+"na" group
- **THEN** the group splits back into ["ba", "na"] with the link button restored between them

### R4. Correct Syllable Groups Turn GREEN (Partial Credit)

After every join or separate, the game MUST evaluate all current groups. Any group that exactly matches a correct syllable in the correct position MUST immediately turn GREEN and become locked (unjoinable/unseparable).

#### Scenario: Partial correct grouping
- **GIVEN** the correct syllable structure for "banana" is [["ba"], ["na", "na"]]
- **WHEN** user joins "na"+"na" into one group (second and third tiles)
- **THEN** that group turns GREEN and locks
- **AND** "ba" remains its default color and unlocked

### R5. Win Condition

When all tile groups are locked (all GREEN), the game MUST call `updatePointsAndTrackers(1)` and play word audio.

#### Scenario: Full word correctly segmented
- **GIVEN** the word "banana" with correct syllable groupings [["ba"], ["na", "na"]]
- **WHEN** the player correctly groups all tiles
- **THEN** all tiles are GREEN
- **AND** `updatePointsAndTrackers(1)` is called
- **AND** the word audio plays

### R6. Challenge Level Controls Max Tile Count

- Level 1 → max 7 tiles (landscape layout `japan_7`)
- Level 2 → max 12 tiles (landscape layout `japan_12`)

Words with more tiles than the level maximum MUST be skipped (re-draw) until a valid word is found.

#### Scenario: Level 1 word length
- **GIVEN** challengeLevel is 1
- **WHEN** a word is selected
- **THEN** the word has at most 7 tiles after SAD removal

### R7. Landscape-Only Orientation

The game MUST force landscape orientation on mount and restore the default on unmount.

#### Scenario: Orientation on enter
- **WHEN** the Japan screen mounts
- **THEN** the device orientation is locked to landscape

### R8. No Distractors

All tiles displayed are from the actual target word. No extra or false tiles are shown.

#### Scenario: Tile count matches word
- **GIVEN** the word is parsed into N tiles
- **THEN** exactly N tile boxes are shown on the board

### R9. Container / Presenter split

`<JapanContainer>` SHALL own all state and logic. `<JapanScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit
- **WHEN** `JapanScreen.tsx` is inspected
- **THEN** it contains no `useGameShell`, `useLangAssets`, or `useTranslation` calls
