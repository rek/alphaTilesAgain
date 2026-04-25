## Why

Malaysia is a scrolling word-audio browser — not a scored game. The screen lists 11 words per page from the current stage's word list, each shown as text + image; tapping a word (or its image) plays its audio. Helps learners hear words paired with their images at their own pace.

## What Changes

- Add `libs/alphaTiles/feature-game-malaysia` — `<MalaysiaContainer>` + `<MalaysiaScreen>`.
- Port Malaysia mechanic:
    - Source: `wordStagesLists[stage - 1]`.
    - Distribute words across pages of 11 (`determineNumPages`, `assignPages`).
    - Each row shows: word text + word image (background drawable).
    - Text colour cycles through `colorList` indices in a pyramid: `[0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]`.
    - Tapping a row plays that word's audio; clicks re-enabled after audio duration.
    - Pagination prev/next arrows; hidden at first/last page.
- Malaysia is in `NO_TRACKER_COUNTRIES` — MUST NOT call `incrementPointsAndTracker`.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-malaysia` — paginated browser of words (text + image) with on-tap audio playback.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-malaysia` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/malaysia.tsx`.

## Out of Scope

- Scoring / tracker increment (Malaysia is in NO_TRACKER_COUNTRIES).
- Syllable variant.
- Custom rows-per-page beyond 11.
- Search / filter UI.
