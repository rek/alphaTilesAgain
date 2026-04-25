## Why

Georgia trains learners to identify the first sound of a word. Given a word + image, the player picks the correct initial tile (or syllable) from a grid of choices. Variants tune choice count, distractor difficulty, and "first sound" interpretation (raw first tile vs. first non-LV tile, the latter useful for Thai/Lao).

## What Changes

- Add `libs/alphaTiles/feature-game-georgia` — `<GeorgiaContainer>` + `<GeorgiaScreen>`.
- Port Georgia mechanic across `T` and `S` variants:
    - **T-CL1–3**: 6 / 12 / 18 random tile choices from CorV (consonant or vowel) tiles.
    - **T-CL4–6**: 6 / 12 / 18 challenging choices — correct + distractor trio + tiles sharing the first chars.
    - **T-CL7–9**: same counts as 1–3 but target = first non-LV tile of the word; if word starts with `PC`, use the LV that preceded it.
    - **T-CL10–12**: same counts as 4–6 but for the first-non-LV target.
    - **S-CL1–3**: 6 / 12 / 18 random syllable choices.
    - **S-CL4–6**: 6 / 12 / 18 challenging syllables — correct + distractor trio + similar-prefix syllables.
- Word filter: word must begin with a C or V (in the `CorV` list); retry `chooseWord` if not.
- Display: word image + stripped word text after correct.
- Correct → `incrementPointsAndTracker(1)`, play correct + word audio.
- Wrong → play incorrect sound; track wrong.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-georgia` — first-sound-identification game with 12 tile-CL variants and 6 syllable-CL variants.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-georgia` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/georgia.tsx`.

## Out of Scope

- Audio cue for the first sound separate from the full word.
- Tone-aware variants beyond what Java implements.
