## Why

Peru is a 4-choice word-recognition game. Given a word's image, the player picks the correct word text from 4 options. Wrong options are crafted by mutating tiles in the correct word, with mutation strategy varying by challenge level. Builds spelling-from-image fluency.

## What Changes

- Add `libs/alphaTiles/feature-game-peru` — `<PeruContainer>` + `<PeruScreen>`.
- Port Peru mechanic across 3 challenge levels:
    - **CL1**: each wrong answer = correct word with the **first** tile replaced by another tile from the first tile's distractor trio.
    - **CL2**: each wrong answer = correct word with **one random** tile replaced by another tile of the same type (C/V/T/AD).
    - **CL3**: each wrong answer = correct word with **one random** tile replaced by a distractor of that tile.
- All 4 choices MUST be unique; if duplicates appear, regenerate wrong answers until unique.
- Special filter: reject any candidate answer containing the substring `"للہ"` (Arabic ligature issue).
- Display the word image; clicking the image repeats the word audio.
- Correct → `incrementPointsAndTracker(2)`; gray non-correct; play correct + word audio.
- Wrong → play incorrect sound; track wrong answer.
- No syllable variant, no precompute.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-peru` — image→word 4-choice recognition with CL-tuned distractor generation.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-peru` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/peru.tsx`.

## Out of Scope

- Syllable variant.
- Hint system / partial reveals.
- Choice counts other than 4.
