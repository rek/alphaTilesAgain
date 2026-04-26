## Why

Sudan is a tile/syllable audio browser — not a scored game. Tiles (or syllables, when `syllableGame === "S"`) from the language pack are paginated; tapping plays that tile's audio. Helps learners hear individual tiles or syllables on demand.

## What Changes

- Add `libs/alphaTiles/feature-game-sudan` — `<SudanContainer>` + `<SudanScreen>`.
- Port Sudan mechanic across two variants:
    - **Tile variant** (`syllableGame === "T"`): `cumulativeStageBasedTileList` minus SAD and silent placeholder consonants. Up to **63 tiles per page**. Type-coloured: `C` → `colorList[1]`, `V` → `colorList[2]`, `T` → `colorList[3]`, default → `colorList[4]`. Tap tile → play tile audio, re-enable after duration.
    - **Syllable variant** (`syllableGame === "S"`): `syllableList`. Up to **35 syllables per page**. Colour from the syllable's own `color` index. Tap syllable → play syllable audio (only when `hasSyllableAudio` is true; otherwise tap is a no-op).
- Pagination prev/next arrows; hidden at first/last page.
- Sudan is in `NO_TRACKER_COUNTRIES` — MUST NOT call `incrementPointsAndTracker`.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-sudan` — paginated tile/syllable audio browser; type-coloured tiles, syllable-coloured syllables.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-sudan` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/sudan.tsx`.

## Out of Scope

- Scoring / tracker increment (Sudan is in NO_TRACKER_COUNTRIES).
- Word context overlays (that's Iraq's mechanic).
- Custom page sizes beyond 63 / 35.
