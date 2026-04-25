# Capability: Japan Game (Syllable Segmentation)

Japan is a tile-linking game where players group a word's tiles into their correct syllable units by tapping link buttons between adjacent tiles.

## ADDED Requirements

### Requirement: Tile Row With Interleaved Link Buttons

The game SHALL render the word's tiles (post-SAD removal) in order, with a tappable "link button" between each adjacent pair of tiles. Tiles MUST be unclickable initially; link buttons MUST be clickable initially.

#### Scenario: Initial board state for a 3-tile word
- **GIVEN** a word parsed into tiles `["ba", "na", "na"]` after SAD removal
- **WHEN** the round starts
- **THEN** 3 tile boxes are shown, interleaved with 2 link buttons
- **AND** all 2 link buttons are visible and tappable
- **AND** all 3 tile boxes are visible and NOT tappable

#### Scenario: Unused tile slots are hidden
- **GIVEN** challengeLevel 2 (layout supports 12 tile slots) and a 4-tile word
- **WHEN** the round starts
- **THEN** the unused tile and link-button slots beyond index 7 SHALL have visibility hidden

### Requirement: Tap Link Button Joins Adjacent Tiles

Tapping a visible link button MUST hide that link button and visually merge the tiles on either side into one contiguous group. The two newly-adjacent tiles MUST become tappable so the user can later separate them.

#### Scenario: Joining first two tiles of "banana"
- **GIVEN** tiles `["ba", "na", "na"]` with link buttons between each
- **WHEN** the user taps the link button between "ba" and "na"
- **THEN** that link button is hidden and removed from the active view list
- **AND** "ba" and "na" appear as one contiguous group
- **AND** "ba" and "na" become tappable

### Requirement: Tap Joined Tile Peels It From Its Group

Tapping a tile that is part of a joined group MUST restore the link button(s) adjacent to the clicked tile (peel behaviour, not full split). For an interior tile joined on both sides, BOTH adjacent link buttons SHALL be restored. For an edge tile, only the inward-facing link button SHALL be restored.

#### Scenario: Separating a tile at the start of a joined pair
- **GIVEN** "ba"+"na" are joined as one group at the start of the row
- **WHEN** the user taps "ba"
- **THEN** the link button between "ba" and "na" is restored (visible, clickable)
- **AND** "ba" becomes unclickable

#### Scenario: Peeling a middle tile joined on both sides
- **GIVEN** three tiles joined into one group `[t1, t2, t3]`
- **WHEN** the user taps `t2`
- **THEN** the link buttons on BOTH sides of `t2` are restored
- **AND** `t1` and `t3` remain joined to nobody (each is its own group)
- **AND** `t2` becomes unclickable

### Requirement: Partial-Credit Green Locking Between Correct Boundaries

After every join or separate, the game MUST evaluate the current view sequence. For any pair of consecutive correct boundary link-buttons that are both present in `currentViews` with the expected tiles between them, the intermediate tiles SHALL be colored green, given white text, and made unclickable; the bookend link buttons SHALL be made unclickable. The first/last syllable uses the row start/end as a sentinel boundary.

#### Scenario: Middle syllable correctly bracketed without joining
- **GIVEN** correct syllable boundaries fall after tile index 1 and tile index 3
- **WHEN** the user has not yet joined any tiles but those two boundary link-buttons are still in place with the expected tiles between them
- **THEN** the tiles at indices 2 and 3 SHALL turn green and unclickable
- **AND** the bookend link buttons SHALL become unclickable

#### Scenario: Wrong join breaks the credit
- **GIVEN** the user joins tiles across a non-syllable boundary
- **WHEN** evaluation runs
- **THEN** that link button is no longer in `currentViews`, so no syllable that depends on it as a bookend can be credited

### Requirement: Win Condition By Whole-Word Concatenation

The game MUST detect win by concatenating the text of every entry in `currentViews` (both tiles AND any remaining link-button dot characters) and comparing against `wordInLOP` with SAD characters stripped. On equality, the game SHALL play the correct chime then the word audio, call `updatePointsAndTrackers(1)`, color all tiles green/white, disable all views, and unlock the advance arrow and options row.

#### Scenario: Player joins all tiles into one group
- **GIVEN** a word whose SAD-stripped LOP form equals the concatenation of its tile texts
- **WHEN** the user taps every link button so all tiles are joined and concatenation matches
- **THEN** `playCorrectSoundThenActiveWordClip(false)` is called
- **AND** `updatePointsAndTrackers(1)` is called
- **AND** every tile turns green with white text and is disabled
- **AND** `repeatLocked` becomes false and the advance arrow turns blue

#### Scenario: Audio order on win
- **WHEN** the win condition fires
- **THEN** the correct-sound clip plays BEFORE the active word clip (single sequenced call)

### Requirement: Challenge Level Selects Layout And Max Tile Count

`challengeLevel` SHALL select layout and tile-count cap: level 1 uses `japan_7` with `MAX_TILES = 7`; level 2 uses `japan_12` with `MAX_TILES = 12`. Words whose post-SAD parse exceeds `MAX_TILES` MUST be rejected and `chooseWord` re-invoked until a fitting word is found.

#### Scenario: Level 1 rejects oversized words
- **GIVEN** challengeLevel is 1
- **WHEN** `chooseWord` returns a word that parses to 8 tiles
- **THEN** the game re-runs `chooseWord` and discards the 8-tile word

#### Scenario: Level 2 cap
- **GIVEN** challengeLevel is 2
- **WHEN** a word is selected for play
- **THEN** the parsed-tile count SHALL be at most 12

### Requirement: Landscape-Only Orientation

The game MUST force landscape orientation on mount. RTL scripts SHALL mirror the instruction-audio and repeat icons.

#### Scenario: Orientation lock on enter
- **WHEN** the Japan screen mounts
- **THEN** `ScreenOrientation.LANDSCAPE` is requested

#### Scenario: RTL icon mirroring
- **GIVEN** `scriptDirection` is "RTL"
- **WHEN** the screen mounts
- **THEN** the instructions image and repeat image are flipped on the Y axis

### Requirement: SAD-Tile Removal

The game MUST remove SAD tiles from `parsedRefWordTileArray` before display, and SAD-text syllables from `parsedRefWordSyllableArray`. Win-comparison MUST use a SAD-stripped form of `wordInLOP`.

#### Scenario: SAD tile not shown
- **GIVEN** a word containing a SAD tile
- **WHEN** tiles are rendered
- **THEN** the SAD tile is absent from the row

### Requirement: No Distractors

All tiles displayed SHALL come from the actual target word. The game MUST NOT introduce extra or false tiles.

#### Scenario: Tile count matches parsed word
- **GIVEN** the word parses to N tiles after SAD removal
- **THEN** exactly N tile boxes are visible on the board

### Requirement: Container / Presenter Split

`<JapanContainer>` SHALL own all state, hooks, and i18n; `<JapanScreen>` SHALL be a pure props-to-JSX presenter and MUST NOT import `react-i18next`, `useGameShell`, or `useLangAssets`.

#### Scenario: Presenter purity audit
- **WHEN** `JapanScreen.tsx` is statically inspected
- **THEN** it contains no `useGameShell`, `useLangAssets`, or `useTranslation` calls
