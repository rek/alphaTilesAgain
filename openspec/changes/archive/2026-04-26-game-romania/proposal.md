## Why

`docs/ARCHITECTURE.md §17` declares that concrete game classes are ported from the original Java app as needed. Romania is a "Scanning" game that helps students recognize a specific tile within various words. It is unique among the game mechanics because it is a non-scoring, observation-based game.

## What Changes

- Add `libs/alphaTiles/feature-game-romania` — `<RomaniaContainer>` + `<RomaniaScreen>`.
- Port Romania's scanning mechanic:
    - Display a "Focus Tile".
    - Cycle through words that contain the focus tile.
    - Support `scanSetting` (1: Initial only, 2: Initial preferred, 3: All positions).
    - Support `boldInitialFocusTiles` setting: the focus tile within the word is displayed in bold.
- Use `feature-game-shell` for UI chrome, audio instructions, and navigation.
- Romania is a `NO_TRACKER_COUNTRY`, so the shell will automatically handle the absence of tracker progression.

## Capabilities

### New Capabilities

- `game-romania` — Romania scanning mechanic: Display focus tile and a sequence of words containing it, with position-based filtering and bolding.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-romania` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/romania.tsx`.

## Out of Scope

- Other games (`Chile`, `Japan`).
- Points/Tracker progression (by design).
