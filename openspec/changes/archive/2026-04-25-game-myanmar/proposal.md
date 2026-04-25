## Why

Myanmar is a 7×7 word-search puzzle. 7 hidden words (3–7 tiles each) are placed on the grid; remaining cells are filled with random non-vowel tiles. The player selects two endpoints (or a sequence of cells) and the game checks whether the path between them spells a placed word. Builds tile recognition and visual scanning.

## What Changes

- Add `libs/alphaTiles/feature-game-myanmar` — `<MyanmarContainer>` + `<MyanmarScreen>`.
- Port Myanmar mechanic:
    - Place 7 words on a 7×7 grid in directions allowed by `challengeLevel`:
        - **CL1**: horizontal-right + vertical-down only.
        - **CL2**: + diagonal (4 directions total).
        - **CL3**: + reverse (8 directions total).
    - Words with no valid placement after 100 attempts: excluded; `completionGoal` decremented.
    - Fill remaining cells with random non-vowel tiles.
    - Two selection methods (settings key `Selection Method for Word Search`):
        - **Method 1 (classic)**: tap first cell, tap second cell → check span.
        - **Method 2 (stack)**: tap up to 8 cells in sequence; auto-check after each tap.
    - On word found: cycle next `colorList` colour for that span; show word in `activeWordTextView`; `wordsCompleted++`.
    - When `wordsCompleted === completionGoal`: set advance arrow blue; `incrementPointsAndTracker(wordsCompleted)`; play correct + word audio (true variant); clear images.
    - Image bank (right side): 7 word images; tapping an image plays its audio + shows its text.
- 49 tile buttons in 7×7 grid; tile text size set proportionally to screen height.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-myanmar` — 7×7 word-search puzzle with 3 direction-tier challenge levels and two selection methods.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-myanmar` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/myanmar.tsx`.

## Out of Scope

- Grid sizes other than 7×7.
- Word counts other than 7.
- Scoring beyond the completion award.
