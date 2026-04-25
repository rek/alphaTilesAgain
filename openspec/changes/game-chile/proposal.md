## Why

Chile is a foundational "Identification" game (Picture-to-Word). It exercises word recognition by matching a visual prompt with the correct written word from a set of distractors. This mechanic is a staple of literacy training.

## What Changes

- Add `libs/alphaTiles/feature-game-chile` — `<ChileContainer>` + `<ChileScreen>`.
- Port Chile's identification mechanic:
    - Display a word image.
    - Provide 4 word choices (1 correct, 3 distractors).
    - Selecting correct word increments points/trackers via shell.
- Level scaling: difficulty can be adjusted by distractor selection similarity.
- Use `feature-game-shell` for UI chrome, audio instructions, and navigation.

## Capabilities

### New Capabilities

- `game-chile` — Chile identification mechanic: Matching an image to one of four word choices.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-chile` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/chile.tsx`.

## Out of Scope

- Other matching variants (Audio-to-Word, etc.) — those may be Italy or other countries.
