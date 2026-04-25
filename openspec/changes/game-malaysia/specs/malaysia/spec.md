# Capability: Malaysia Game (Word Browser)

Malaysia is a non-scored word browser. Words from the current stage are paginated 11 per page; tapping a row plays that word's audio. Malaysia is in `NO_TRACKER_COUNTRIES` and MUST NOT increment points.

## Requirements

### R1. Source and Pagination

The displayed words MUST come from `wordStagesLists[stage - 1]` and MUST be paginated 11 per page.

#### Scenario: Full first page shows 11 rows
- **GIVEN** the stage word list has 23 words
- **WHEN** the screen renders page 0
- **THEN** 11 word rows are visible

#### Scenario: Last page renders only the remainder
- **GIVEN** the stage word list has 23 words
- **WHEN** the screen renders page 2
- **THEN** exactly 1 row is visible

### R2. Pyramid Colour Cycle

Row text colours MUST follow the pyramid `[0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]` indexing `colorList`. Pages with fewer than 11 rows MUST use the corresponding prefix of the pyramid.

#### Scenario: Row 5 uses colorList[7]
- **GIVEN** a page with at least 6 rows
- **WHEN** row index 5 is rendered
- **THEN** its text colour equals `colorList[7]`

### R3. Pagination Arrows

Prev arrow MUST be hidden when `page === 0`. Next arrow MUST be hidden when `page === pageCount - 1`. Both MUST be visible otherwise.

### R4. Tap Plays Audio

Tapping a row (text or image) MUST play that word's audio. Further taps MUST be ignored until the audio ends. Switching pages MUST cancel any pending audio and re-enable taps.

### R5. NO_TRACKER Guard

Malaysia MUST NOT call `incrementPointsAndTracker`. There is no win/lose state, no points event.

#### Scenario: Tapping rows awards no points
- **GIVEN** the user taps any number of rows in any order
- **WHEN** their audio plays
- **THEN** no `incrementPointsAndTracker` call is made

### R6. Container / Presenter Split

`<MalaysiaContainer>` SHALL own all state, hook usage, and audio refs. `<MalaysiaScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.
