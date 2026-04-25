## ADDED Requirements

### Requirement: Stats screen displays total points, trackers, last played, and per-game rows

`<PlayerStatsScreen>` SHALL render four data sections for the selected player:

1. Total points (numeric).
2. Total trackers checked (numeric).
3. Last played, formatted as a human-readable date, or `"—"` when the player has never played.
4. A list of per-game rows showing game label, points, and `trackerCount` — one row per `ProgressKey` in `useProgressStore` whose key contains the player's id.

#### Scenario: Player with progress

- **GIVEN** a player whose `useProgressStore` has three entries
- **WHEN** the stats screen renders
- **THEN** the total points value equals the sum of the three entries' `points`
- **AND** the total trackers value equals the sum of the three entries' `trackerCount`
- **AND** the last-played label is the date string for the maximum `lastPlayed` epoch among those entries
- **AND** three per-game rows are rendered

#### Scenario: Player who has never played

- **GIVEN** a player with no entries in `useProgressStore`
- **WHEN** the stats screen renders
- **THEN** total points is `0`
- **AND** total trackers is `0`
- **AND** the last-played label is `"—"`
- **AND** zero per-game rows are rendered

### Requirement: Container/presenter split

`<PlayerStatsContainer>` SHALL own all hooks (`useLocalSearchParams`, `useTranslation`, `usePlayersStore`, `useTotalPoints`, `useTotalTrackers`, `useLastPlayed`, `useProgressStore`) and SHALL pass already-formatted, pre-translated values to `<PlayerStatsScreen>`. `<PlayerStatsScreen>` SHALL NOT import `react-i18next`.

#### Scenario: Presenter is i18n-blind

- **WHEN** `<PlayerStatsScreen>`'s import graph is inspected
- **THEN** it does not contain `react-i18next` or `i18next`

#### Scenario: Last played is formatted in the container

- **WHEN** `<PlayerStatsContainer>` mounts and `useLastPlayed` returns a non-zero epoch
- **THEN** the container formats it via `Intl.DateTimeFormat` with `dateStyle: 'medium'` before passing as `lastPlayedLabel`

### Requirement: useTotalTrackers aggregates across all of a player's keys

`data-progress` SHALL export `useTotalTrackers(playerId: string): number`. The hook SHALL sum `trackerCount` across every entry in `useProgressStore` whose key contains `playerId`.

#### Scenario: Sum across multiple games

- **GIVEN** the store has entries for `playerId='alice'` with `trackerCount` of `3`, `5`, `2`
- **WHEN** a component calls `useTotalTrackers('alice')`
- **THEN** the hook returns `10`

#### Scenario: Other players excluded

- **GIVEN** the store has entries for `playerId='alice'` (`trackerCount=3`) and `playerId='bob'` (`trackerCount=99`)
- **WHEN** a component calls `useTotalTrackers('alice')`
- **THEN** the hook returns `3`

#### Scenario: No entries

- **GIVEN** the store has no entries containing `playerId='alice'`
- **WHEN** a component calls `useTotalTrackers('alice')`
- **THEN** the hook returns `0`

### Requirement: useLastPlayed returns the most recent epoch or 0

`data-progress` SHALL export `useLastPlayed(playerId: string): number`. The hook SHALL return the maximum `lastPlayed` value across the player's entries, or `0` if there are no entries.

#### Scenario: Returns max across entries

- **GIVEN** the store has entries for `playerId='alice'` with `lastPlayed` values `1000`, `2000`, `1500`
- **WHEN** a component calls `useLastPlayed('alice')`
- **THEN** the hook returns `2000`

#### Scenario: Returns 0 when no entries

- **GIVEN** the store has no entries containing `playerId='alice'`
- **WHEN** a component calls `useLastPlayed('alice')`
- **THEN** the hook returns `0`

### Requirement: Navigation entry from choose-player

`feature-choose-player` SHALL render a Stats button on the player detail view. Pressing it SHALL navigate to `/player-stats` with the active player's id passed as the `playerId` route parameter.

#### Scenario: Stats button navigates with playerId

- **WHEN** the user presses the Stats button on a player detail view
- **THEN** the app navigates to `/player-stats?playerId=<id>` (or equivalent expo-router params form)
