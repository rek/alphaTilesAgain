## MODIFIED Requirements

### Requirement: Door grid derived from `aa_games.txt`

`/menu` SHALL render one door per row of `aa_games.txt` (as parsed into `langAssets.gameList`). Each door's `index` (1-based) SHALL be its position in raw `aa_games.txt` file order, computed identically to today — this value is unaffected by grid/display ordering (see "Tier-grouped door layout") and remains the value sent as `doorIndex` on press per the "Door-press navigation contract".

#### Scenario: Small gameList

- **WHEN** `gameList` has 5 entries
- **THEN** `/menu` renders 5 doors, each door's `index` matching its 1-based row position in `aa_games.txt`

#### Scenario: Empty gameList

- **WHEN** `gameList` is empty (authoring error or fresh scaffold)
- **THEN** `/menu` renders an empty grid with no doors and the pagination arrows are both hidden

## ADDED Requirements

### Requirement: Tier-grouped door layout

The door grid's *rendering position* (independent of each door's `index`/`doorIndex`) SHALL be ordered by `(tierForGame(classKey), original aa_games.txt row order)` — doors group by curriculum tier ascending, and within a tier keep their original file order. Pagination (`doorsPerPage` slicing) SHALL operate on this tier-sorted sequence. This ordering MUST NOT alter any door's `index` value or the `doorIndex` sent on press.

#### Scenario: Two games share a tier

- **WHEN** two rows both resolve to tier `2`, and row A precedes row B in `aa_games.txt`
- **THEN** row A's door renders before row B's door in the grid, and each still carries its own unchanged `index`

#### Scenario: Press after tier reordering

- **WHEN** a door originally at `aa_games.txt` row 7 (`index = 7`) is grid-positioned first due to a low tier
- **AND** the learner presses it
- **THEN** `router.push` receives `doorIndex: "7"` (unchanged, per the existing "Door-press navigation contract"), not the door's grid position

### Requirement: Door tier badge

Each door SHALL display a neutral "Level N" badge sourced from `tierForGame(classKey)`, using i18n key `menu.level` interpolated with the tier number. The badge MUST NOT reference age or audience.

#### Scenario: Door tier badge

- **WHEN** a door's mechanic resolves to tier `4` via `tierForGame`
- **THEN** the door renders a badge reading "Level 4" (i18n key `menu.level`, no age/audience wording)
