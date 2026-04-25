# Capability: Iraq Game (Tile Explorer)

Iraq is a non-scored tile reference. Tiles are listed alphabetically and paginated; tapping a tile plays its audio and briefly displays a word containing that tile. Iraq is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## Requirements

### R1. Tile List Composition

The tile list MUST be `cumulativeStageBasedTileList` minus tiles whose text is `SAD` and tiles in `SILENT_PLACEHOLDER_CONSONANTS`. The list MUST be sorted alphabetically by `tile.text`.

#### Scenario: SAD and silent placeholders are excluded
- **GIVEN** `tileList` includes a SAD tile and a silent placeholder consonant
- **WHEN** the screen renders
- **THEN** neither appears in the displayed grid

### R2. Pagination

Tiles MUST be paginated 35 per page in a 5×7 grid. Prev/next arrows MUST be shown only when more than one page exists; the prev arrow MUST be hidden on the first page; the next arrow MUST be hidden on the last page.

### R3. Tile Tap Behavior

Tapping a tile MUST:
1. Play the tile's audio.
2. After audio completion + 500 ms, display the tile cell with white background and the chosen word's text and image overlaid.
3. After 2000 ms, restore the tile to its original text and color.

If the user taps another tile or paginates before the 2 s elapse, pending timers MUST be cancelled and the overlay cleared immediately.

### R4. Word Lookup by `scanSetting`

The displayed word MUST be selected per `scanSetting` (read from `Game 001 Scan Setting`):
- `1`: random word whose tile-position-1 equals the tapped tile.
- `2`: random word whose tile-position-1 equals the tapped tile; if none, fallback to position-2.
- `3`: random word whose tile-position-3 equals the tapped tile.

#### Scenario: scanSetting=2 falls back to position 2
- **GIVEN** scanSetting=2 and no words have the tapped tile in position 1
- **WHEN** the user taps the tile
- **THEN** a random word with the tapped tile in position 2 is displayed

### R5. Iconic Word Override at CL2

When `challengeLevel === 2` and the tapped tile has a non-empty `iconicWord`, the displayed word MUST be that `iconicWord` regardless of `scanSetting`.

### R6. NO_TRACKER Guard

Iraq MUST NOT call `incrementPointsAndTracker`. The screen has no win/lose state, no points event.

#### Scenario: Tapping tiles awards no points
- **GIVEN** the user taps any number of tiles in any order
- **WHEN** their audio plays and overlays appear
- **THEN** no `incrementPointsAndTracker` call is made

### R7. Container / Presenter Split

`<IraqContainer>` SHALL own all state, hook usage, and timer refs. `<IraqScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
