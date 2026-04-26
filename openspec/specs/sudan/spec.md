# Capability: Sudan Game (Tile/Syllable Audio Browser)

Sudan is a non-scored audio browser. It paginates tiles (or syllables when `syllableGame === "S"`); tapping plays that tile/syllable's audio. Sudan is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## ADDED Requirements

### Requirement: Variants and Page Sizes

The Sudan mechanic SHALL support two variants. The tile variant (`syllableGame === "T"`) SHALL display `cumulativeStageBasedTileList` minus `SAD` and `SILENT_PLACEHOLDER_CONSONANTS`, paginated **63 per page**. The syllable variant (`syllableGame === "S"`) SHALL display `syllableList`, paginated **35 per page**. Java reference: `Sudan.java tilesPerPage=63, syllablesPerPage=35; splitTileListAcrossPages; splitSyllablesListAcrossPages`.

#### Scenario: Tile variant excludes SAD and silent placeholder consonants

- **GIVEN** the language pack contains a SAD tile and a silent placeholder consonant
- **WHEN** the tile variant renders
- **THEN** neither tile appears on any page

#### Scenario: Tile pages contain at most 63 tiles

- **GIVEN** the filtered tile list has N tiles
- **WHEN** `sudanPreProcess` runs
- **THEN** `tilePages.length === Math.ceil(N / 63)` and every page except possibly the last has exactly 63 entries

#### Scenario: Syllable pages contain at most 35 syllables

- **GIVEN** `syllableList` has M syllables
- **WHEN** `sudanPreProcess` runs
- **THEN** `syllablePages.length === Math.ceil(M / 35)` and every page except possibly the last has exactly 35 entries

### Requirement: Tile Colour Rules

In the tile variant, each cell's background colour MUST be derived from `tile.typeOfThisTileInstance` exactly as Java's `showCorrectNumTiles` switch: `C` → `colorList[1]`, `V` → `colorList[2]`, `T` → `colorList[3]`, all other types (including `LV`, `AV`, `BV`, `FV`, `AD`, `D`, `PC`, `X`) → `colorList[4]`. Java reference: `Sudan.java showCorrectNumTiles`.

#### Scenario: V tile uses colorList[2]

- **GIVEN** a tile with `typeOfThisTileInstance === "V"`
- **WHEN** `tileColor(tile, colorList)` is computed
- **THEN** it returns `colorList[2]`

#### Scenario: LV tile falls through to default

- **GIVEN** a tile with `typeOfThisTileInstance === "LV"`
- **WHEN** `tileColor(tile, colorList)` is computed
- **THEN** it returns `colorList[4]` (matching Java's default branch)

### Requirement: Syllable Colour Rules

In the syllable variant, each cell's background colour MUST be `colorList[Number(syllable.color)]`, parsing the syllable's own numeric-string colour index. Java reference: `Sudan.java showCorrectNumSyllables: colorList.get(Integer.parseInt(color))`.

#### Scenario: Syllable uses its own colour index

- **GIVEN** a syllable with `color === "5"`
- **WHEN** `syllableColor(syl, colorList)` is computed
- **THEN** it returns `colorList[5]`

### Requirement: Pagination Controls

The screen SHALL render prev/next page arrows whose visibility mirrors `Sudan.java showOrHideScrollingArrows`. The prev arrow MUST be hidden when `page === 0`. The next arrow MUST be hidden when `page === pageCount - 1`. Tapping prev decrements `page` by 1 if `page > 0`; tapping next increments `page` by 1 if `page < pageCount - 1`.

#### Scenario: Prev arrow hidden on first page

- **GIVEN** `page === 0`
- **WHEN** the screen renders
- **THEN** the prev arrow is not visible

#### Scenario: Next arrow hidden on last page

- **GIVEN** `page === pageCount - 1`
- **WHEN** the screen renders
- **THEN** the next arrow is not visible

#### Scenario: Next arrow advances page

- **GIVEN** `page === 0` and `pageCount === 3`
- **WHEN** the user taps next
- **THEN** `page` becomes `1`

### Requirement: Tap Plays Audio

Tapping a tile MUST play its audio via `playTileClip`. Tapping a syllable MUST play its audio via `playSyllableClip` only when the global `hasSyllableAudio` flag is true; otherwise the tap MUST be a no-op (matching Java's `setClickable(false)` for the whole syllable page when `!hasSyllableAudio`). While audio is playing, all tile/syllable buttons AND the options row MUST be disabled; they SHALL re-enable when the clip's duration elapses. Java reference: `Sudan.java onBtnClick`.

#### Scenario: Tile tap plays tile audio

- **GIVEN** the tile variant is rendered and `disabled === false`
- **WHEN** the user taps tile index `i`
- **THEN** `playTileClip(tilesOnPage[i])` is invoked and `disabled` becomes true

#### Scenario: Syllable tap is no-op when hasSyllableAudio is false

- **GIVEN** the syllable variant with global `hasSyllableAudio === false`
- **WHEN** the user taps any syllable
- **THEN** no audio plays and the tap is ignored

#### Scenario: Re-enable after audio completes

- **GIVEN** a tile tap has begun playback
- **WHEN** the audio clip's duration elapses
- **THEN** `disabled` returns to false and the grid + options row become tappable again

### Requirement: NO_TRACKER Guard

Sudan MUST NOT call `incrementPointsAndTracker` or any equivalent points/tracker mutation. There is no win/lose state, no advance arrow colour cycling, and no points event. Java reference: `Sudan.java` contains zero `updatePointsAndTrackers(...)` invocations.

#### Scenario: Tapping tiles awards no points

- **GIVEN** the user taps any number of tiles or syllables across multiple pages
- **WHEN** their audio plays
- **THEN** `incrementPointsAndTracker` is never called

### Requirement: Container / Presenter Split

`<SudanContainer>` SHALL own all state, hook usage, and audio refs. `<SudanScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and SHALL NOT import `react-i18next`.

#### Scenario: Presenter has no i18n imports

- **WHEN** `SudanScreen.tsx` is statically analyzed
- **THEN** it does not import `react-i18next`

#### Scenario: Presenter has no shell hooks

- **WHEN** `SudanScreen.tsx` is statically analyzed
- **THEN** it does not call `useGameShell`, `useLangAssets`, `useAudio`, or `usePrecompute`
