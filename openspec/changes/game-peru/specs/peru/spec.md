# Capability: Peru Game (4-Choice Word Recognition)

Peru shows a word image and 4 word-text choices; the player picks the one that names the image. Wrong answers are produced by mutating tiles in the correct word; mutation strategy varies by `challengeLevel`. **Behaviour MUST match `Peru.java` exactly, including off-by-one quirks.**

## Requirements

### R1. Choice Count

Exactly 4 choices MUST be displayed: 1 correct + 3 wrong. The correct word's text MUST be among them. The correct's slot MUST be randomly chosen each round.

### R2. CL1 — First-Tile Distractor Trio

In CL1 each wrong answer MUST be the correct word with **only tile[0]** replaced. The 3 replacements MUST come from the **shuffled distractor trio** of tile[0] — one trio entry per wrong slot (Java loops `shuffledDistractorTiles.get(incorrectLapNo - 1)`).

#### Scenario: CL1 mutates only the first tile
- **GIVEN** correct word parses to `["c","a","t"]` in CL1 and tile `"c"` has distractor trio `["k","s","x"]`
- **WHEN** wrong answers are generated
- **THEN** the 3 wrong texts are the strings produced by `combineTilesToMakeWord` for `["k","a","t"]`, `["s","a","t"]`, `["x","a","t"]` (in shuffled order)

### R3. CL2 — Same-Type Replacement

In CL2 each wrong answer MUST replace **one tile** of the correct word at random index `idx = floor(rng() * (len - 1))` (matching Java's `nextInt(tileLength - 1)`, which **excludes** the last tile). The replacement MUST be drawn at random from the same-type pool (`V`/`C`/`T`/`AD`) for `parsed[idx]`'s `typeOfThisTileInstance`. Per-type pools MUST be shuffled once at round-shell mount when `challengeLevel === 2`.

### R4. CL3 — Distractor-Trio at Random Index

In CL3 each wrong answer MUST replace **one tile** of the correct word at random index `idx = floor(rng() * (len - 1))` (same off-by-one as R3). The replacement MUST be drawn at random from `parsed[idx]`'s distractor trio (`alt1`/`alt2`/`alt3`).

### R5. Uniqueness Invariant

The 4 choices MUST all be distinct strings. CL2/CL3 generators MUST regenerate (re-pick `idx` and replacement) until the candidate is distinct from the correct text and from previously-built wrongs (max 200 iterations). CL1 generators MUST use distinct trio entries (Java's loop indexing guarantees this when the trio is non-degenerate).

### R6. Forbidden Substring Filter

Any candidate wrong answer containing the substring `"للہ"` MUST be rejected and regenerated.

### R7. Correct Answer

When the player taps a choice whose text equals the correct text, the game MUST:
- Gray out the 3 non-correct choices (background `#A9A9A9`, text `#000000`).
- Call `shell.incrementPointsAndTracker(true)` (which increments points by 1 — equivalent to Java's `updatePointsAndTrackers(2)` after design D8 of game-engine-base).
- Play the correct chime, then replay the word audio.
- Set advance arrow to blue (handled implicitly by shell after `incrementPointsAndTracker`).

### R8. Wrong Answer

When the player taps a non-correct choice, the game MUST play the incorrect chime and track the chosen text (cap 3 distinct entries). All choices remain tappable for retry until the correct one is picked.

### R9. Image Tap Repeats Audio

Tapping the word image MUST replay the active word clip via `shell.replayWord()`.

### R10. No Syllable Variant

The mechanic MUST NOT vary with `syllableGame`. There is no syllable mode and no precompute.

### R11. Container / Presenter Split

`<PeruContainer>` SHALL own all state and hook usage. `<PeruScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and no `react-i18next` import.

### R12. Insufficient-Content Fallback

If after 5 attempts no parseable word produces 4 unique non-forbidden choices, the screen MUST render in a locked/empty state (no choices, no interaction).
