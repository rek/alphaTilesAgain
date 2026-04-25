## Why

Iraq is a tile explorer / reference screen — not a scored game. The screen lists every tile from the cumulative stage tile list (excluding SAD and silent placeholder consonants), sorted alphabetically and paginated 35-per-page in a 5×7 grid. Tapping a tile plays its audio and briefly shows a real word containing that tile, helping learners hear and see tiles in context.

## What Changes

- Add `libs/alphaTiles/feature-game-iraq` — `<IraqContainer>` + `<IraqScreen>`.
- Port Iraq mechanic:
    - Build tile list: `cumulativeStageBasedTileList` minus SAD and silent placeholder consonants, alphabetically sorted by `tile.text`.
    - Paginate 35 tiles per page in a 5×7 grid.
    - Tap tile: play tile audio. After `tileAudioDuration + 500ms`, show a random word containing that tile, picked by `scanSetting`:
        - `1`: words where tile is in position 1.
        - `2`: position 1, fallback to position 2 if no position-1 words.
        - `3`: position 3.
    - If `challengeLevel === 2` and the tile has an `iconicWord`: use that specific word instead.
    - Word display: white-background tile with word text + word image overlay.
    - After 2 seconds: restore the tile to its original text and color.
    - Pagination prev/next arrows; hidden at first/last page.
- Iraq is in `NO_TRACKER_COUNTRIES` — MUST NOT call `incrementPointsAndTracker`.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-iraq` — alphabetised tile-explorer that plays audio and surfaces words containing each tile.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-iraq` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/iraq.tsx`.

## Out of Scope

- Scoring / tracker increment (Iraq is in NO_TRACKER_COUNTRIES).
- Syllable variant.
- Custom layouts beyond 5×7 / 35-per-page.
