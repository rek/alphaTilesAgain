## Why

Brazil is a "find the missing tile" game. The screen shows a word with one tile (vowel, consonant, or tone) blanked out; the player picks the correct tile from a set of choices. Builds phonemic awareness around a specific tile-type category.

## What Changes

- Add `libs/alphaTiles/feature-game-brazil` — `<BrazilContainer>` + `<BrazilScreen>`.
- Port Brazil mechanic across 7 challenge levels + 2 syllable levels:
    - **CL1–3** (vowels): pick missing vowel. CL1=4 random, CL2=correct+distractor trio, CL3=all vowels (≤15).
    - **CL4–6** (consonants): same shape but consonants.
    - **CL7** (tones): up to 4 tone tiles; hide extras when tone count < 4.
    - **SL1–2** (syllables, when `syllableGame="S"`): SL1=correct+3 random syllables, SL2=correct+distractor trio.
- Word selection filters by required tile type (must contain a vowel for CL<4, consonant for CL4–6, tone for CL7); retry until match.
- `removeTile` blanks one matching tile (never a SAD tile) with `"__"`; the partial word is shown in `activeWordTextView`.
- Correct pick → `incrementPointsAndTracker(1)`, reveal full word, gray non-correct tiles, advance arrow blue.
- Wrong pick → play incorrect sound; track wrong answer.
- Use `feature-game-shell` for chrome/navigation.

## Capabilities

### New Capabilities

- `game-brazil` — "find the missing tile" game with vowel/consonant/tone/syllable variants and 7 challenge levels.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-brazil` (`type:feature`, `scope:alphaTiles`).
- **New route**: `apps/alphaTiles/app/games/brazil.tsx`.

## Out of Scope

- Multi-blank words (only one tile is removed per round).
- Hint system or tile audio on tap (only tap-to-answer).
