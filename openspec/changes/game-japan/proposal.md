## Why

Japan is a "Missing Tile" game. It focuses on phonemic awareness by requiring the player to identify the correct tile needed to complete a word. This builds on tile-word correspondence skills.

## What Changes

- Add `libs/alphaTiles/feature-game-japan` — `<JapanContainer>` + `<JapanScreen>`.
- Port Japan's missing-tile mechanic:
    - Display a word with one tile replaced by a placeholder (`_`).
    - Provide multiple choice tiles (1 correct, N distractors).
    - Selecting the correct tile completes the word and increments points.
- Use `feature-game-shell` for UI chrome, audio instructions, and navigation.

## Capabilities

### New Capabilities

- `game-japan` — Japan missing-tile mechanic: Identifying the correct tile to complete a word.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-japan` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/japan.tsx`.

## Out of Scope

- Other games.
