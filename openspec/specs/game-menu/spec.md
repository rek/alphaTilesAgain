# Game Menu Specification

## Purpose
TBD - imported from archived change. Update Purpose after archive.

## Requirements

### Requirement: Door grid derived from `aa_games.txt`

`/menu` SHALL render one door per row of `aa_games.txt` (resolved as Doors by `@alphaTiles/data-doors`, `useDoors()`), in difficulty-ladder order (see "Tier-grouped door layout"). Each door SHALL display its `index`. Each door's `index` (1-based) SHALL be its position in raw `aa_games.txt` file order, computed identically to today — this value is unaffected by grid/display ordering (see "Tier-grouped door layout") and remains the value sent as `doorIndex` on press per the "Door-press navigation contract".

#### Scenario: Small gameList

- **WHEN** `gameList` has 5 entries
- **THEN** `/menu` renders 5 doors, each door's `index` matching its 1-based row position in `aa_games.txt`

#### Scenario: Empty gameList

- **WHEN** `gameList` is empty (authoring error or fresh scaffold)
- **THEN** `/menu` renders an empty grid with no doors and the pagination arrows are both hidden

### Requirement: Per-door tint from `aa_colors.txt`

Each door's tint color SHALL be resolved once by the Door catalogue as `colorList[parseInt(game.color)]` (0-based index into the parsed `aa_colors.txt`). The resolved hex string SHALL be passed to the presenter as `colorHex`. The presenter SHALL NOT resolve the color itself.

#### Scenario: Color index 2

- **WHEN** a game row has `Color = "2"` and `colorList[2] = "#FF5722"`
- **THEN** the door renders with fill color `#FF5722` (in the visual state that uses fill tint)

#### Scenario: Invalid color index

- **WHEN** a game row has `Color = "99"` but `colorList.length = 9`
- **THEN** the parser surfaces a warning and the container passes a neutral default (`#808080`) for that door

### Requirement: Door visual state derivation

Each door's visual SHALL come from door progress (`doorProgressOf(...).visual`, `@alphaTiles/data-door-progress`) → `'not-started' | 'in-process' | 'mastery'`:

- If the door does not track progress (no-right/wrong) → `'in-process'`.
- Else if `trackerCount >= 12` (mastered) → `'mastery'`.
- Else if `trackerCount > 0` → `'in-process'`.
- Else → `'not-started'`.

#### Scenario: Brand-new door

- **WHEN** `trackerCount = 0` and `noRightWrong = false`
- **THEN** the visual is `'not-started'`

#### Scenario: In-progress door

- **WHEN** `trackerCount = 7` and `noRightWrong = false`
- **THEN** the visual is `'in-process'`

#### Scenario: Mastered door

- **WHEN** `trackerCount = 15` and `noRightWrong = false`
- **THEN** the visual is `'mastery'`

#### Scenario: No-right-wrong door

- **WHEN** `noRightWrong = true` (regardless of `trackerCount`)
- **THEN** the visual is `'in-process'`

### Requirement: No-right-wrong classification from `aa_games.txt`

`door.noRightWrong` SHALL be sourced from the `NoRightWrong` column of `aa_games.txt` when present. When the column is absent (older pack schema), the parser SHALL fall back to a hardcoded `classKey` list: `['romania', 'sudan', 'malaysia', 'iraq']`. The menu code SHALL NOT inspect class names directly.

#### Scenario: Pack declares column

- **WHEN** `aa_games.txt` has column `NoRightWrong` with value `"1"` on a row
- **THEN** that row's door renders with `noRightWrong = true`

#### Scenario: Pack omits column, row in fallback list

- **WHEN** `aa_games.txt` has no `NoRightWrong` column and a row has `Country = "Romania"`
- **THEN** the door renders with `noRightWrong = true`

#### Scenario: Pack omits column, row not in fallback list

- **WHEN** `aa_games.txt` has no `NoRightWrong` column and a row has `Country = "China"`
- **THEN** the door renders with `noRightWrong = false`

### Requirement: Pagination with configurable page size

Doors SHALL paginate at `doorsPerPage` per page, where `doorsPerPage` comes from `aa_settings.txt "Doors per page"` (clamped to `[6, 40]`, default `20`). Prev / next arrow affordances SHALL appear only when a previous / next page exists.

#### Scenario: Small gameList, one page

- **WHEN** `gameList.length = 12` and `doorsPerPage = 20`
- **THEN** all 12 doors render on page 0 and no pagination arrows show

#### Scenario: Two-page gameList

- **WHEN** `gameList.length = 32` and `doorsPerPage = 20`
- **THEN** page 0 shows doors 1..20 with a next arrow (no prev); page 1 shows doors 21..32 with a prev arrow (no next)

#### Scenario: Pack-declared page size

- **WHEN** `aa_settings.txt` has `"Doors per page" = 30`
- **THEN** `doorsPerPage` resolves to 30

#### Scenario: Invalid page size

- **WHEN** `aa_settings.txt` has `"Doors per page" = 100`
- **THEN** `doorsPerPage` clamps to 40 and a warning is logged

#### Scenario: Fresh page resets on re-entry

- **WHEN** a user navigates away from `/menu` (to a game, or to `/choose-player`) and returns
- **THEN** the grid shows page 0 again (not the last-visited page)

### Requirement: Door progress read from `data-door-progress`

The menu SHALL obtain each door's tracker count and visual via `useDoorProgressOf(activePlayerId)` (`@alphaTiles/data-door-progress`), keyed by `Door.progressKey(playerId)` — never by scanning store keys.

#### Scenario: Progress present

- **WHEN** the player has `trackerCount = 5` on door 3
- **THEN** door 3 renders as `in-process`

### Requirement: Player-bar chrome

`/menu` SHALL display a player bar containing the active player's avatar (resolved via `langManifest.images.avataricons[activePlayer.avatarIndex]`) and their name.

#### Scenario: Active player rendered

- **WHEN** `useActivePlayer()` returns `{ name: "Ada", avatarIndex: 3 }`
- **THEN** the player bar shows "Ada" and the image at `images.avataricons[3]`

#### Scenario: No active player (navigation failure)

- **WHEN** `/menu` is reached without an active player (unexpected; the loading screen should prevent this)
- **THEN** the container redirects to `/choose-player` via `router.replace`

### Requirement: Utility-icon visibility

- **About** icon SHALL always render (routes to `/about`).
- **Share** icon SHALL render iff `langAssets.hasShare === true`.
- **Resources** icon SHALL render iff `langAssets.hasResources === true`.
- **Audio instructions** icon SHALL render iff `langAssets.hasEarthInstructions === true`.

#### Scenario: Pack has no share content

- **WHEN** `aa_share.txt` has only a header row
- **THEN** `langAssets.hasShare = false` and the share icon is not rendered

#### Scenario: Pack has resources

- **WHEN** `aa_resources.txt` has content rows
- **THEN** the resources icon renders and routes to `/resources` on press

#### Scenario: Pack omits earth instructions audio

- **WHEN** `audio/instructions/zzz_earth.mp3` is not present
- **THEN** the audio-instructions icon is not rendered

### Requirement: Back arrow clears active player

The back-arrow affordance on `/menu` SHALL call `clearActivePlayer()` (setting `activePlayerId` to null) and navigate to `/choose-player` via `router.replace`.

#### Scenario: Back arrow press

- **WHEN** the learner taps the back arrow on `/menu`
- **THEN** `activePlayerId` becomes null
- **AND** the app routes to `/choose-player`

#### Scenario: Menu is not in back-stack after replace

- **WHEN** the user reaches `/choose-player` via the back arrow and presses the OS back button
- **THEN** the app does not return to `/menu` (stack replaced, not pushed)

### Requirement: Door-press navigation contract

Pressing a door SHALL route via `router.push('/games/[classKey]', { classKey, doorIndex, challengeLevel })` using `expo-router`'s typed navigation. The menu SHALL pass only these three params; the target screen resolves all other per-door state from the Door catalogue (`useDoor`).

#### Scenario: Press door 3 (china, level 1)

- **WHEN** the learner taps door 3 whose `classKey = "china"` and `challengeLevel = 1`
- **THEN** `router.push` is called with pathname `/games/[classKey]` and params `{ classKey: "china", doorIndex: "3", challengeLevel: "1" }`

#### Scenario: Analytics beacon

- **WHEN** a door is pressed
- **THEN** `track('door_opened', { classKey, index, challengeLevel })` is called before navigation

### Requirement: A11y and i18n contract

All interactive affordances SHALL carry `accessibilityLabel` + `accessibilityRole`. Labels SHALL come from `chrome:menu.*` i18n keys. No hardcoded English strings SHALL appear in the presenter or any `ui-*` library.

#### Scenario: Door a11y

- **WHEN** the menu renders door 5 in `in-process` state
- **THEN** its `accessibilityLabel` resolves from `t('chrome:menu.a11y.door', { index: 5, state: 'in-process' })` (or an equivalent composable)

#### Scenario: Presenter has no `useTranslation`

- **WHEN** `GameMenuScreen` (presenter) is inspected
- **THEN** it does not import `react-i18next` or any translation hook

### Requirement: Library boundaries

- `libs/alphaTiles/feature-game-menu` SHALL be `type:feature`, `scope:alphaTiles`. MAY depend on `data-language-assets`, `data-players`, `data-progress` (forward-referenced), `util-i18n`, `util-theme`, `util-analytics`, `ui-door-grid`, `ui-door`, `expo-router`.
- `libs/shared/ui-door-grid` SHALL be `type:ui`, `scope:shared`. MAY depend on `ui-door` and `type:util` libs.
- `libs/shared/ui-door` SHALL be `type:ui`, `scope:shared`. MAY depend on `react-native-svg` and `type:util` libs. SHALL NOT import from any `data-access` or `feature` library.

#### Scenario: UI lib import graph

- **WHEN** `nx graph` inspects `ui-door` and `ui-door-grid`
- **THEN** neither depends on `react-i18next` nor on any `data-*` or `feature-*` library

#### Scenario: Forward-referenced data-progress

- **WHEN** `game-engine-base` has not yet landed
- **THEN** `feature-game-menu` still builds, tests pass, and the menu renders with all doors in `not-started` state

### Requirement: Tier-grouped door layout

The door grid's *rendering position* (independent of each door's `index`/`doorIndex`) SHALL be ordered by `(tierForGame(classKey), original aa_games.txt row order)` — `ladderOrder` over `Door.tier` (`@alphaTiles/data-doors`) — doors group by curriculum tier ascending, and within a tier keep their original file order. Pagination (`doorsPerPage` slicing) SHALL operate on this tier-sorted sequence. This ordering MUST NOT alter any door's `index` value or the `doorIndex` sent on press.

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

### Requirement: Menu offers the self-test

The game menu SHALL show a "Check yourself" button below the door grid when the pack can build a self-test, navigating to `/self-test`.

#### Scenario: yue menu
- **GIVEN** the yue build
- **WHEN** the menu renders
- **THEN** the "Check yourself" button appears after the last door
