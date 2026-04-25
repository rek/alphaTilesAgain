## Why

`useTotalPoints(playerId)` already aggregates points across a player's games but is rendered nowhere. Players (and teachers/parents) cannot see cumulative progress: total points earned, total trackers checked, last play date, or per-game breakdown.

A dedicated stats screen surfaces the aggregate the data layer already computes, plus per-game rows derived from `useProgressStore`.

## What Changes

- Add `libs/alphaTiles/feature-player-stats` (`type:feature`, `scope:alphaTiles`).
- Add route `apps/alphaTiles/app/player-stats.tsx` accepting `playerId` as route param.
- Add `<PlayerStatsContainer>` + `<PlayerStatsScreen>` (i18n-blind presenter).
- Extend `data-progress` with two new hooks:
  - `useTotalTrackers(playerId)` — sums `trackerCount` across all keys containing the player's id.
  - `useLastPlayed(playerId)` — returns the most recent `lastPlayed` epoch across the player's keys, or `0` if never played.
- Stats displayed:
  - Total points (`useTotalPoints`).
  - Total trackers checked (`useTotalTrackers`).
  - Last played, human-readable; "—" when never played.
  - Per-game-instance rows: game name, points, trackerCount — derived from `useProgressStore` filtered by `playerId`.
- Wire navigation entry from `feature-choose-player`'s player detail to `/player-stats?playerId=<id>`.

## Capabilities

### New Capabilities

- `player-stats-screen` — aggregate + per-game stats view for a single player; entry from choose-player flow.

### Modified Capabilities

- `data-progress` — adds `useTotalTrackers(playerId)` and `useLastPlayed(playerId)` aggregation hooks.
- `feature-choose-player` — adds a "Stats" navigation entry on player detail.

## Impact

- New lib `libs/alphaTiles/feature-player-stats`.
- New route `apps/alphaTiles/app/player-stats.tsx`.
- Two new hooks exported from `data-progress` (additive, no change to existing exports).
- `feature-choose-player` gets one new button and one navigation call.
- No schema changes to persisted progress.
- No breaking changes.

## Out of Scope

- Cross-player comparisons or leaderboards.
- Stats export (CSV, share sheet).
- Date-ranged filters ("this week" vs all-time).
- Charts/graphs — v1 is text rows only.
- Editing/resetting stats from this screen.

## Unresolved Questions

- Date format for "last played": locale-aware via `Intl.DateTimeFormat` or simple `YYYY-MM-DD`? Default to `Intl.DateTimeFormat(locale, { dateStyle: 'medium' })`.
- Per-game row label: use `country` or a friendlier name? Default to country until a game-name registry is added.
