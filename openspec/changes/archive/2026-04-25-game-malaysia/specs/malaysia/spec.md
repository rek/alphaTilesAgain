# Capability: Malaysia Game (Word Browser)

Malaysia is a non-scored word browser. Words from the current stage are paginated 11 per page; tapping a row plays that word's audio. Malaysia is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## ADDED Requirements

### Requirement: Source and Pagination

The displayed words SHALL come from `wordStagesLists[stage - 1]` and SHALL be paginated 11 per page (`wordsPerPage = GAME_BUTTONS.length === 11`, `Malaysia.java:28-33`). Pages are filled left-to-right via `assignPages()` (`Malaysia.java:80-89`).

#### Scenario: Full first page shows 11 rows

- **GIVEN** the stage word list has 23 words
- **WHEN** the screen renders page 0
- **THEN** 11 word rows are visible

#### Scenario: Last page renders only the remainder

- **GIVEN** the stage word list has 23 words
- **WHEN** the screen renders page 2
- **THEN** exactly 1 row is visible and remaining cells are `INVISIBLE` and unclickable

#### Scenario: Word text uses standardized character sequence

- **WHEN** a row's text is rendered
- **THEN** it MUST be produced by `wordInLOPWithStandardizedSequenceOfCharacters(word)` (`Malaysia.java:105-106`)

### Requirement: Pyramid Color Cycle

Row background colors SHALL follow the pyramid pattern `[0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]` indexing `colorList`, matching the Java expression `int color = i<5 ? i : i>5 ? 10-i : 7;` (`Malaysia.java:107`). When `colorless === true`, every row SHALL use `colorList[8]` instead.

#### Scenario: Row index 5 uses colorList[7]

- **GIVEN** a page with at least 6 rows and `colorless === false`
- **WHEN** row index 5 is rendered
- **THEN** its background color equals `colorList[7]`

#### Scenario: Pyramid mirrors around the apex

- **GIVEN** a full 11-row page and `colorless === false`
- **WHEN** rows 0..10 are rendered
- **THEN** background color indices are `[0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]`

#### Scenario: Colorless mode uses colorList[8] for every row

- **GIVEN** `colorless === true`
- **WHEN** any row is rendered
- **THEN** its background color equals `colorList[8]` regardless of row index

### Requirement: Pagination Arrows

The forward (next) arrow MUST be hidden when `currentPageNumber >= numPages` (last page). The backward (prev) arrow MUST be hidden when `currentPageNumber <= 0` (first page). Both MUST be visible otherwise. Matches `Malaysia.java:187-192`.

#### Scenario: First page hides backward arrow

- **GIVEN** `currentPageNumber === 0`
- **WHEN** the screen renders
- **THEN** the backward arrow is `INVISIBLE`

#### Scenario: Last page hides forward arrow

- **GIVEN** `currentPageNumber === numPages`
- **WHEN** the screen renders
- **THEN** the forward arrow is `INVISIBLE`

#### Scenario: Single-page stage hides both arrows

- **GIVEN** the stage word list has 7 words (`numPages === 0`)
- **WHEN** the screen renders
- **THEN** both forward and backward arrows are `INVISIBLE`

### Requirement: Tap Plays Word Audio

Tapping a row's text or its image SHALL play that word's audio via `gameSounds.play(audioId, 1.0f, 1.0f, 2, 0, 1.0f)` and SHALL disable all game buttons and word images for the duration of the audio (`Malaysia.java:194-212`). Buttons MUST re-enable when `repeatLocked === true` after the word's `duration` elapses.

#### Scenario: Tap plays word audio

- **GIVEN** the user taps row index 3 on the active page
- **WHEN** the handler fires
- **THEN** `playWord(wordPagesLists[currentPageNumber][3])` is invoked

#### Scenario: Image tap plays the same word audio

- **WHEN** the user taps a row's image
- **THEN** `clickPicHearAudio` delegates to `onWordClick(view)` and the same word audio plays

#### Scenario: Re-tap during audio is suppressed

- **GIVEN** a word's audio is playing
- **WHEN** the user taps another row
- **THEN** the second tap is ignored until the audio's `duration` elapses

#### Scenario: Page change cancels pending audio

- **WHEN** the user navigates to a different page while a word audio is playing
- **THEN** any pending re-enable is cancelled and the new page renders with all rows clickable

### Requirement: NO_TRACKER Guard

Malaysia MUST NOT call `incrementPointsAndTracker`. There is no win/lose state and no points event. Malaysia is in `NO_TRACKER_COUNTRIES`.

#### Scenario: Tapping rows awards no points

- **GIVEN** the user taps any number of rows in any order
- **WHEN** their audio plays
- **THEN** no `incrementPointsAndTracker` call is made

### Requirement: RTL Layout

When `scriptDirection === "RTL"`, the forward and backward arrow images MUST be rotated `setRotationY(180)` and the constraint set MUST swap forward/backward arrow positions relative to `gamesHomeImage` and `instructions` (`Malaysia.java:146-167`).

#### Scenario: RTL flips arrows and reorders constraints

- **GIVEN** `scriptDirection === "RTL"`
- **WHEN** the screen mounts
- **THEN** both arrows are mirrored horizontally and their layout positions are swapped

### Requirement: Container / Presenter Split

`<MalaysiaContainer>` SHALL own all state, hook usage, and audio refs. `<MalaysiaScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `MalaysiaScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
