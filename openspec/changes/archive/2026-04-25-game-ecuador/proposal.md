## Why

Ecuador is a word-image matching game with a scattered layout. The screen shows one prominent word + image and 8 randomly-positioned word tiles; the player taps the tile whose text matches the prompt. The scatter layout strengthens visual scanning and word recognition.

## What Changes

- Add `libs/alphaTiles/feature-game-ecuador` — `<EcuadorContainer>` + `<EcuadorScreen>`.
- Port Ecuador mechanic:
    - Display the prompt word + its variant-2 image (`<word>2.png`).
    - Place 8 word tiles at random non-overlapping positions with random widths.
    - One of the 8 tiles is the correct word; the other 7 are different words from `cumulativeStageBasedWordList`.
    - Correct tap → `incrementPointsAndTracker(2)`; play correct + word audio; gray non-correct tiles.
    - Wrong tap → play incorrect sound; track wrong answer.
- No challenge levels, no syllable variant, no precompute — same mechanic regardless of `challengeLevel` and `syllableGame`.
- Tile placement: up to 10 000 attempts per tile to avoid overlap; if a tile cannot be placed, restart placement.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-ecuador` — scatter-layout word-image matching game; pick the tile matching the prompt word.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-ecuador` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/ecuador.tsx`.

## Out of Scope

- Challenge-level differentiation (mechanic is identical at every level).
- Syllable variant.
- Audio prompts beyond standard correct/incorrect/word clip.
