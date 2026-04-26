# Capability: Iraq Game (Tile Explorer)

Iraq is a non-scored tile reference. Tiles are listed alphabetically and paginated; tapping a tile plays its audio and briefly displays a word containing that tile. Iraq is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## ADDED Requirements

### Requirement: Tile List Composition

The tile list SHALL be `cumulativeStageBasedTileList` minus tiles in `SAD` and tiles in `SILENT_PLACEHOLDER_CONSONANTS`. The list MUST be sorted alphabetically by `tile.text`. When `differentiatesTileTypes` is `false`, duplicate tiles whose `text` already appeared MUST be skipped (matches Java `Iraq.java:113-133, 149-164`).

#### Scenario: SAD and silent placeholders are excluded

- **GIVEN** `cumulativeStageBasedTileList` includes a tile in `SAD` and a silent placeholder consonant
- **WHEN** the screen renders
- **THEN** neither tile appears in the displayed grid

#### Scenario: Multitype duplicates collapsed when not differentiating

- **GIVEN** `differentiatesTileTypes === false` and tile text `"a"` appears twice (V and C instances) in `MULTITYPE_TILES`
- **WHEN** the tile list is built
- **THEN** only the first `"a"` instance is kept

### Requirement: Pagination

Tiles MUST be paginated 35 per page in a 5×7 grid (`tilesPerPage = 35`, matches `Iraq.java:37`). The previous-page arrow MUST be hidden on page 0; the next-page arrow MUST be hidden on the last page (Java `showOrHideScrollingArrows` lines 220-234).

#### Scenario: First page hides prev arrow

- **GIVEN** `currentPageNumber === 0`
- **WHEN** the screen renders
- **THEN** the previous-page arrow is `INVISIBLE`

#### Scenario: Last page hides next arrow

- **GIVEN** `currentPageNumber === numPages` (last page)
- **WHEN** the screen renders
- **THEN** the next-page arrow is `INVISIBLE`

#### Scenario: Exact-multiple total tiles

- **GIVEN** the filtered tile list has exactly 70 tiles
- **WHEN** pagination is computed
- **THEN** there are 2 pages of 35 tiles each

### Requirement: Tile Tap Behavior

Tapping a tile SHALL execute the following sequence (matches `Iraq.java:236-446`):

1. Play the tile's audio via `gameSounds.play(tileAudioId, ...)`.
2. After `tileAudioDuration + 500 ms`, set the tile's background to white and overlay the chosen word's text plus its image (`ImageView` via `wordInLWC` drawable lookup).
3. After 2000 ms, remove the image and restore the tile's original text and background color.

While a tap is animating (`isAnimating === true`), all game buttons, the options row, and page arrows MUST be unclickable.

#### Scenario: Tap plays tile audio first

- **WHEN** the user taps a visible tile
- **THEN** `playTileClip(tile)` is invoked before any word audio

#### Scenario: Overlay clears after 2000 ms

- **GIVEN** a tile tap has started its overlay
- **WHEN** 2000 ms elapse
- **THEN** the tile reverts to its original text and color and buttons re-enable

#### Scenario: Re-tap during animation is ignored

- **GIVEN** an animation is in progress (`isAnimating === true`)
- **WHEN** the user taps another tile
- **THEN** the second tap is ignored

### Requirement: Word Lookup by `scanSetting`

The displayed word SHALL be selected per `scanSetting` (read from settings key `Game 001 Scan Setting`), matching `Iraq.java:346-376`:

- `scanSetting === 1` (default): random word whose tile-position-1 equals the tapped tile; if none, no word is shown.
- `scanSetting === 2`: random word whose tile-position-1 equals the tapped tile; if none, fall back to position 2; if still none, no word is shown.
- `scanSetting === 3`: random word whose tile-position-3 equals the tapped tile; if none, no word is shown.

#### Scenario: scanSetting=2 falls back to position 2

- **GIVEN** `scanSetting === 2` and no words have the tapped tile in position 1
- **WHEN** the user taps the tile
- **THEN** a random word with the tapped tile in position 2 is displayed

#### Scenario: scanSetting=3 looks only at position 3

- **GIVEN** `scanSetting === 3`
- **WHEN** the user taps a tile present at position 1 but not position 3 of any word
- **THEN** no word is displayed (skip; tile reverts after audio)

#### Scenario: scanSetting=1 default

- **GIVEN** `scanSetting === 1`
- **WHEN** the user taps a tile
- **THEN** a random word with the tile at position 1 is shown; if none exists, the tile reverts after audio

### Requirement: Iconic Word Override at CL2

When `challengeLevel === 2` and the tapped tile has a non-empty `iconicWord` (not `null`, not empty, not `"-"`), the displayed word MUST be that `iconicWord` regardless of `scanSetting`. The `wordInLOP` text SHALL be passed through `stripInstructionCharacters` before display. Matches `Iraq.java:292-340`.

#### Scenario: CL2 iconic word overrides scan

- **GIVEN** `challengeLevel === 2`, `scanSetting === 3`, and the tapped tile has `iconicWord === "cat"`
- **WHEN** the user taps the tile
- **THEN** the word `"cat"` is shown regardless of position-3 lookup

#### Scenario: CL2 with `"-"` iconicWord falls through

- **GIVEN** `challengeLevel === 2` and the tapped tile's `iconicWord === "-"`
- **WHEN** the user taps the tile
- **THEN** the normal `scanSetting` lookup is used

### Requirement: NO_TRACKER Guard

Iraq MUST NOT call `incrementPointsAndTracker`. The screen has no win/lose state and no points event. Iraq is in `NO_TRACKER_COUNTRIES`.

#### Scenario: Tapping tiles awards no points

- **GIVEN** the user taps any number of tiles in any order
- **WHEN** their audio plays and overlays appear
- **THEN** no `incrementPointsAndTracker` call is made

### Requirement: RTL Layout

When `scriptDirection === "RTL"`, the instructions, next-page, and previous-page arrow images MUST be rotated `setRotationY(180)`, matching `Iraq.java:90-98`.

#### Scenario: RTL flips arrow images

- **GIVEN** `scriptDirection === "RTL"`
- **WHEN** the screen mounts
- **THEN** the next-page and previous-page arrows are mirrored horizontally

### Requirement: Container / Presenter Split

`<IraqContainer>` SHALL own all state, hook usage, and timer refs. `<IraqScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `IraqScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
