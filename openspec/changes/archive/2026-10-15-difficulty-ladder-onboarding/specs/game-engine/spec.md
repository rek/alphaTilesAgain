## MODIFIED Requirements

### Requirement: Celebration triggers on 12-tracker boundary

When `trackerCount % 12 === 0` and `trackerCount > 0` and `after12CheckedTrackers === 3`, the shell SHALL render `<Celebration>` for approximately 1800ms (after the correct-final sound completes), then navigate to the next uncompleted game approximately 4500ms after the boundary was crossed. Both timings preserve `GameActivity.java:342` and `:412`. "Next" follows the difficulty-ladder play order (`useLadderDoors`: tier, then `aa_games.txt` row order) — the same order as the `/menu` grid.

#### Scenario: Crossing the 12-tracker boundary

- **WHEN** a correct answer brings `trackerCount` to 12 and the language pack has `after12CheckedTrackers = 3`
- **THEN** after `correctSoundDuration + 1800ms` the shell mounts `<Celebration>`; after `4500ms` total, the shell navigates to the next enabled door that is not mastered (`nextUnmasteredDoor`, `@alphaTiles/data-door-progress`), searching in ladder order

#### Scenario: Next door crosses a tier boundary

- **WHEN** the mastered door is the last door of its tier (e.g. yue door 28, Iraq, tier 0)
- **THEN** the next door is the first unmastered door of the next populated tier (yue door 1, Thailand, tier 2), not the next row in `aa_games.txt`

#### Scenario: `after12CheckedTrackers === 2`

- **WHEN** the same boundary is crossed but the setting is `2`
- **THEN** the shell navigates directly to `/earth` after `correctSoundDuration` ms — no `<Celebration>`

#### Scenario: `after12CheckedTrackers === 1`

- **WHEN** the same boundary is crossed but the setting is `1`
- **THEN** the shell does nothing — the player continues in the same game

#### Scenario: All games completed

- **WHEN** the search for a next-uncompleted-game in `gameList` finds none (every enabled door is mastered)
- **THEN** the shell navigates to `/earth`
