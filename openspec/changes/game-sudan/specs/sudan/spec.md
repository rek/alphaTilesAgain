# Capability: Sudan Game (Tile/Syllable Audio Browser)

Sudan is a non-scored audio browser. It paginates tiles (or syllables when `syllableGame === "S"`); tapping plays that tile/syllable's audio. Sudan is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## Requirements

### R1. Variants and Page Sizes

- **Tile variant** (`syllableGame === "T"`): displays `cumulativeStageBasedTileList` minus SAD and silent placeholder consonants, paginated **63 per page**.
- **Syllable variant** (`syllableGame === "S"`): displays `syllableList`, paginated **35 per page**.

#### Scenario: Tile variant excludes SAD and silent placeholder consonants
- **GIVEN** the language pack contains a SAD tile and a silent placeholder consonant
- **WHEN** the tile variant renders
- **THEN** neither tile is shown

### R2. Colour Rules

- Tile variant cell colour MUST be:
  - `colorList[1]` for `C`,
  - `colorList[2]` for vowel types (`V`/`LV`/`AV`/`BV`/`FV`),
  - `colorList[3]` for `T`,
  - `colorList[4]` otherwise.
- Syllable variant cell colour MUST be `colorList[syllable.colorIndex]`.

### R3. Pagination

Prev/next arrows MUST be visible only when more than one page exists. Prev MUST be hidden on the first page; next MUST be hidden on the last page.

### R4. Tap → Audio

Tapping a tile MUST play its audio. Tapping a syllable MUST play its audio only when `hasSyllableAudio` is true; otherwise the tap MUST be a no-op. Further taps MUST be ignored until the audio ends. Switching pages MUST cancel pending audio and re-enable taps.

### R5. NO_TRACKER Guard

Sudan MUST NOT call `incrementPointsAndTracker`. There is no win/lose state, no points event.

#### Scenario: Tapping tiles awards no points
- **GIVEN** the user taps any number of tiles or syllables
- **WHEN** their audio plays
- **THEN** no `incrementPointsAndTracker` call is made

### R6. Container / Presenter Split

`<SudanContainer>` SHALL own all state, hook usage, and audio refs. `<SudanScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
