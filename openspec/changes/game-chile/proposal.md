## Why

Chile is a tile-based Wordle clone. It builds phonemic awareness by having players guess a secret word using the language pack's tile alphabet. Unlike standard Wordle, tiles are phonemic units (which may be multi-character) rather than individual letters.

## What Changes

- Add `libs/alphaTiles/feature-game-chile` — `<ChileContainer>` + `<ChileScreen>`.
- Port Chile's Wordle mechanic:
    - A secret word is randomly selected from the pack's wordlist (filtered by min/max tile length).
    - The player builds guesses tile-by-tile using an on-screen tile keyboard.
    - Submitting a complete guess colors each tile: GREEN (correct tile, correct position), BLUE (correct tile, wrong position), GRAY (tile not in word).
    - The keyboard updates to reflect the best known color for each tile.
    - Win: a guess where all tiles are GREEN → `updatePointsAndTrackers(1)`.
    - Lose: exhausted all rows → show correct answer in GREEN, no points.
- Number of guess rows = `baseGuessCount - challengeLevel + 1` (default `baseGuessCount = 8`; L1 = 8 rows, L2 = 7, L3 = 6).
- Precompute (`chilePreProcess`): builds the tile keyboard (sorted union of all tiles used in valid words, max 50) and the filtered word list.
- Use `feature-game-shell` for UI chrome and navigation.

## Capabilities

### New Capabilities

- `game-chile` — Chile Wordle mechanic: guess a phonemic-tile word within N rows; green/blue/gray tile feedback; keyboard reflects best-known colors.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-chile` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/chile.tsx`.

## Out of Scope

- Hard-mode constraints (must use confirmed tiles in subsequent guesses).
- Hint system or audio prompts — Chile is text-only.
- Custom keyboard layout beyond `keyboardWidth` setting.
