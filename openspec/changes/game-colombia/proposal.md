## Why

Colombia is a "build the word" game. The player taps tiles (or syllables) on a keyboard to construct the active word. Live feedback shades the current attempt yellow when on-track, orange when wrong-tile, and gray when overlong. It builds tile sequencing fluency and connects audio to spelling.

## What Changes

- Add `libs/alphaTiles/feature-game-colombia` — `<ColombiaContainer>` + `<ColombiaScreen>`.
- Port Colombia mechanic across "T" (tile) and "S" (syllable) variants:
    - **T-CL1**: keyboard = exact tiles of the current word, shuffled.
    - **T-CL2**: keyboard = word tiles + one distractor per tile, shuffled.
    - **T-CL3**: full keyboard from `aa_keyboard.txt`, paginated at 33/page when keys > 35.
    - **T-CL4**: full deduplicated `tileList`, type-colored, paginated.
    - **S-CL1**: word's syllables, shuffled.
    - **S-CL2**: word's syllables + one distractor each, shuffled.
    - **S-CL3**: all syllables, paginated at 18/page.
    - **S-CL4**: unsupported → immediately go back to country menu.
- Live evaluation: compare `currentAttempt` to `correctString` prefix-by-prefix.
    - On-track → yellow.
    - Diverged → orange.
    - Over-length → gray.
- Win: exact match → `incrementPointsAndTracker(4)` + correct/word audio.
- Delete button removes the last keyed tile/syllable.
- Pagination arrows when keyboard exceeds one page.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-colombia` — tile-keyboard word-builder with 4 challenge levels per variant and live correctness feedback.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-colombia` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/colombia.tsx`.

## Out of Scope

- Custom keyboard layouts beyond `aa_keyboard.txt`.
- Free-form on-screen typing (only keyed tile selection).
- Hints / on-tile audio playback.
