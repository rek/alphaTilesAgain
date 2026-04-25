## ADDED Requirements

### Requirement: 4-Choice Word Recognition Round

The Peru mechanic SHALL render a word image plus exactly 4 word-text choice buttons. The correct word's standardized text MUST appear in one of the 4 slots, chosen at random each round. The remaining 3 slots MUST be filled with mutated wrong answers per the active `challengeLevel` strategy. This ports `Peru.java:104–207 playAgain`.

#### Scenario: Fresh round rendering

- **GIVEN** a language pack with at least one parseable multi-tile word
- **WHEN** `<PeruContainer>` mounts with `challengeLevel ∈ {1, 2, 3}`
- **THEN** the screen renders a 2×2 grid of 4 choice buttons and a word-image header

#### Scenario: Insufficient content

- **WHEN** no word can be picked that produces 4 unique non-forbidden choices within 5 attempts
- **THEN** the screen renders an empty/locked state and no choices are interactive

### Requirement: CL1 First-Tile Distractor Trio

When `challengeLevel === 1`, each of the 3 wrong answers SHALL equal the correct word with **only tile[0]** replaced. The 3 replacements SHALL be drawn one-each from the shuffled distractor trio (`alt1`, `alt2`, `alt3`) of tile[0]. Java reference: `Peru.java:127–143` — `shuffledDistractorTiles.get(incorrectLapNo - 1)`.

#### Scenario: CL1 mutates only the first tile

- **GIVEN** the correct word parses to `["c","a","t"]` and tile `"c"` has trio `["k","s","x"]` in CL1
- **WHEN** the wrong answers are generated
- **THEN** the 3 wrong texts are `combineTilesToMakeWord` outputs for `["k","a","t"]`, `["s","a","t"]`, `["x","a","t"]` (in the trio's shuffled order)

### Requirement: CL2 Same-Type Replacement at Random Index

When `challengeLevel === 2`, each wrong answer SHALL replace **one tile** of the correct word at a random index `idx = floor(rng() * (len - 1))` (matching Java's `nextInt(tileLength - 1)`, which **excludes** the last tile). The replacement tile SHALL be drawn at random from the same-type pool (`V`/`C`/`T`/`AD`) for `parsed[idx].typeOfThisTileInstance`. The per-type pools SHALL be shuffled once at mount when `challengeLevel === 2`.

#### Scenario: CL2 never replaces the last tile

- **GIVEN** correct word parses to `["c","a","t"]` (length 3) in CL2
- **WHEN** any wrong answer is generated
- **THEN** the wrong answer's last character equals `"t"` for every seed

#### Scenario: CL2 replacement matches the original tile type

- **GIVEN** correct word parses with `parsed[1]` of type `V`
- **WHEN** the generator selects index 1 for replacement
- **THEN** the replacement tile is drawn from the V pool (vowels)

### Requirement: CL3 Distractor-Trio at Random Index

When `challengeLevel === 3`, each wrong answer SHALL replace **one tile** of the correct word at random index `idx = floor(rng() * (len - 1))` (same off-by-one as CL2). The replacement SHALL be drawn at random from `parsed[idx]`'s distractor trio.

#### Scenario: CL3 replacement comes from the picked tile's trio

- **GIVEN** correct word parses to `["c","a","t"]` and tile `"a"` has trio `["e","i","o"]` in CL3
- **WHEN** the generator selects index 1 for replacement
- **THEN** the resulting wrong answer's middle character is one of `"e"`, `"i"`, or `"o"`

### Requirement: Uniqueness Invariant

The 4 displayed choices SHALL all be distinct strings. CL2/CL3 generators SHALL regenerate (re-pick `idx` and replacement) until each candidate is distinct from the correct text and from any previously-built wrong, capped at 200 iterations. CL1 generators SHALL use distinct trio entries.

#### Scenario: 4 unique choices

- **WHEN** any round renders
- **THEN** `Set(choices).size === 4`

### Requirement: Forbidden Substring Filter

Any candidate wrong answer containing the substring `"للہ"` SHALL be rejected and regenerated. Java reference: `Peru.java:137–141, 168–171, 195–198`.

#### Scenario: Candidate containing للہ is rejected

- **GIVEN** a candidate wrong answer string contains `"للہ"`
- **WHEN** `buildAllChoices` evaluates it
- **THEN** the candidate is discarded and the generator retries

### Requirement: Correct Answer Handling

When the player taps a choice whose text equals the correct text, the game SHALL:

- Gray out the 3 non-correct choices (background `#A9A9A9`, text `#000000`).
- Call `shell.incrementPointsAndTracker(true)`.
- Sequence audio: play the correct chime, then replay the active word clip.

Java reference: `Peru.java:209–248 respondToWordSelection` (correct branch).

#### Scenario: Correct tap grays the others and scores

- **GIVEN** the player taps the choice matching the correct text
- **WHEN** the handler fires
- **THEN** the 3 non-correct buttons are grayed and `shell.incrementPointsAndTracker` is called with `true`

#### Scenario: Correct tap sequences correct chime then word audio

- **GIVEN** the correct choice is tapped
- **WHEN** the audio sequence runs
- **THEN** `audio.playCorrect()` is awaited before `shell.replayWord()` is invoked

### Requirement: Wrong Answer Handling

When the player taps a non-correct choice, the game SHALL play the incorrect chime and track the chosen text (cap 3 distinct entries). Choices SHALL remain tappable for retry until the correct one is picked. Java reference: `Peru.java:249–262`.

#### Scenario: Wrong tap plays incorrect chime

- **GIVEN** the player taps a wrong choice
- **WHEN** the handler fires
- **THEN** `audio.playIncorrect()` is invoked and the choice remains enabled

### Requirement: Image Tap Repeats Audio

Tapping the word image SHALL replay the active word clip via `shell.replayWord()`. Java reference: `Peru.java:clickPicHearAudio → super.playActiveWordClip`.

#### Scenario: Image tap replays word audio

- **WHEN** the player taps the word image
- **THEN** `shell.replayWord()` is invoked

### Requirement: No Syllable Variant

The mechanic SHALL NOT vary with `syllableGame`. There is no syllable mode and no precompute.

#### Scenario: Same mechanic regardless of syllableGame

- **WHEN** the route mounts with any `syllableGame` value
- **THEN** the choice generation strategy is unchanged

### Requirement: Container / Presenter Split

`<PeruContainer>` SHALL own all state and hook usage. `<PeruScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for sizing) and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `PeruScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
