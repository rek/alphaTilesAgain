## ADDED Requirements

### Requirement: Choice Count by Challenge Level

Visible choice count SHALL follow `countForLevel(level)`:

- `level % 3 === 1` → 6 choices (CL 1, 4, 7, 10).
- `level % 3 === 2` → 12 choices (CL 2, 5, 8, 11).
- `level % 3 === 0` → 18 choices (CL 3, 6, 9, 12).

Java reference: `Georgia.java:112–127` (switch on challengeLevel sets `visibleGameButtons`).

#### Scenario: CL1 has 6 choices

- **GIVEN** challengeLevel=1
- **WHEN** the round starts
- **THEN** 6 choices are visible

#### Scenario: CL12 has 18 choices

- **GIVEN** challengeLevel=12
- **WHEN** the round starts
- **THEN** 18 choices are visible

#### Scenario: CL5 has 12 choices

- **GIVEN** challengeLevel=5
- **WHEN** the round starts
- **THEN** 12 choices are visible

### Requirement: Correct Target per Band

For tile variant:

- **CL 1–6:** `correct` MUST equal `parsedTiles[0]`.
- **CL 7–12:** the algorithm MUST walk `parsedTiles` advancing past tiles whose `typeOfThisTileInstance == "LV"`. The first non-LV tile encountered is the candidate. If the candidate's type is `PC`, `correct` MUST equal the most-recently-passed LV tile (`initialLV`) when non-null; otherwise `correct` MUST equal `parsedTiles[t+1]` where `t` is the candidate's index.

For syllable variant (CL 1–6, S):

- `correct` MUST equal `parsedSyllables[0]`.

Java reference: `Georgia.java:173–195`.

#### Scenario: CL1 correct equals first tile

- **GIVEN** parsedTiles = `["c", "a", "t"]` in CL1
- **WHEN** correct is computed
- **THEN** correct == "c"

#### Scenario: CL7 skips leading LV

- **GIVEN** parsedTiles = `[LV-tile, C-tile, V-tile]` in CL7
- **WHEN** correct is computed
- **THEN** correct == "C-tile"

#### Scenario: CL7 PC after LV uses preceding LV

- **GIVEN** parsedTiles = `[LV-tile, PC-tile, V-tile]` in CL7
- **WHEN** correct is computed
- **THEN** correct == "LV-tile"

#### Scenario: S-CL1 correct equals first syllable

- **GIVEN** parsedSyllables = `["sa", "lo"]` in S-CL1
- **WHEN** correct is computed
- **THEN** correct == "sa"

### Requirement: Word Filter (Tile Variant Only)

For the tile variant, the chosen word's computed `correct` tile MUST be a member of the `CorV` list (consonant or vowel tiles). If not, `pickWord` MUST recursively retry. The syllable variant SHALL NOT apply the CorV filter. Java reference: `Georgia.java:188–190` (filter inside non-S branch only).

#### Scenario: Tile variant retries when correct is not in CorV

- **GIVEN** the chosen word's `correct` tile has type other than C or V
- **WHEN** `pickWord` runs in tile variant
- **THEN** `pickWord` is invoked recursively until a valid word is found

#### Scenario: Syllable variant skips CorV filter

- **GIVEN** any chosen word in syllable variant
- **WHEN** `pickWord` runs
- **THEN** the CorV check is not performed

### Requirement: Tile Random Branch (CL 1, 2, 3, 7, 8, 9)

For tile variant random bands, each visible slot SHALL receive a tile drawn uniformly from `corV` via `floor(rng() * corV.length)` (NO off-by-one) with duplicates rejected via re-draw. After all visible slots are filled, if `initialTile.text` is not present, the algorithm MUST overwrite `GAME_BUTTONS[floor(rng() * (visibleGameButtons - 1))]` (excluding the last visible slot) with `initialTile.text`. Java reference: `Georgia.java:351–373, 391–395`.

#### Scenario: Random branch never repeats a tile

- **GIVEN** CL=2 with corV.length >= 12
- **WHEN** the random branch runs
- **THEN** the 12 visible texts are distinct

#### Scenario: Fallback overwrite never targets last visible slot

- **GIVEN** the random branch fails to include `initialTile.text` and visibleGameButtons=6
- **WHEN** the fallback overwrite runs for any RNG seed
- **THEN** the overwritten slot index is in `[0, 4]` (never index 5)

### Requirement: Tile Hard Branch (CL 4, 5, 6, 10, 11, 12)

For tile variant hard bands, the choice set SHALL be built (in insertion order) as:

1. `initialTile.text` followed by `initialTile.distractors[0..2]`.
2. **Pass A:** while `set.size < N`, draw `idx = floor(rng() * (corV.length - 1))` and add `corV[idx].text` ONLY when both texts have length >= 2 AND share the same first AND second character; iterate up to `corV.length` times.
3. **Pass B:** same draw method; add when same first char OR same last char; iterate up to `corV.length` times.
4. **Pass C:** same draw method; add unconditionally until `set.size === N`.

The `nextInt(CorV.size() - 1)` off-by-one (last entry never drawn) MUST be preserved. Java reference: `Georgia.java:294–339`.

#### Scenario: Hard branch always includes correct + 3 distractors

- **GIVEN** any CL in {4, 5, 6, 10, 11, 12}
- **WHEN** choices are built
- **THEN** the first 4 entries (insertion order) are `initialTile.text`, `initialTile.distractors[0]`, `initialTile.distractors[1]`, `initialTile.distractors[2]`

#### Scenario: Hard branch off-by-one excludes last corV entry

- **GIVEN** corV.length = 10 and any seed
- **WHEN** any of the three fill passes runs
- **THEN** no draw returns `corV[9].text`

### Requirement: Syllable Random Branch (S-CL 1, 2, 3)

For syllable variant random bands, each visible slot `t` SHALL receive `syllablePool[t].text` where `syllablePool` was shuffled via `Collections.shuffle` at round start (Java ~153). After all visible slots are filled, if `initialSyllable.text` is not present in any visible slot's text, the algorithm MUST overwrite `GAME_BUTTONS[floor(rng() * (visibleGameButtons - 1))]` with `initialSyllable.text`. Java reference: `Georgia.java:247–259, 279–284`.

#### Scenario: Syllable random branch is sequential after shuffle

- **GIVEN** S-CL=1 with `syllablePool = [s0, s1, s2, ...]` (post-shuffle)
- **WHEN** the random branch runs
- **THEN** visible slots 0..5 receive `s0..s5` in order

### Requirement: Syllable Hard Branch (S-CL 4, 5, 6)

For syllable variant hard bands, the choice set SHALL be built (in insertion order) as:

1. `initialSyllable.text` + `initialSyllable.distractors[0..2]`.
2. **Pass A (sequential over `syllablePool`):** while `set.size < N` and `i < syllablePool.length`, take `opt = syllablePool[i].text`. If `opt.length >= 2 AND initialSyllable.text.length >= 2`: add when `opt[0] === initialSyllable.text[0] AND opt[1] === initialSyllable.text[1]`; else add when `opt[0] === initialSyllable.text[0]`. Otherwise (either length < 2): add when `opt[0] === initialSyllable.text[0]`; else add when last chars match.
3. **Pass B (pure-random fill):** while `set.size < N`, sequentially take `syllablePool[j]` and add it. (Java uses sequential indexing, not random — Java ~232.)

Java reference: `Georgia.java:204–235`.

#### Scenario: Syllable hard branch starts with correct + distractors

- **GIVEN** any S-CL in {4, 5, 6}
- **WHEN** choices are built
- **THEN** the first 4 entries are `initialSyllable.text` and its 3 distractors

### Requirement: Choice Color Cycle

Choice tile background colors SHALL cycle through `colors.hexByIndex[t % 5]` for slot `t`. Choice text color SHALL be `#FFFFFF`. Slots with index `>= visibleGameButtons` SHALL be hidden/non-interactive (or omitted from render). Java reference: `Georgia.java:245, 348`.

#### Scenario: Color cycle wraps at 5

- **GIVEN** any band
- **WHEN** the visible slots render
- **THEN** slot 0 and slot 5 share the same background color (when both are visible)

### Requirement: Round Start Plays Word Audio

When `playAgain` runs, the game SHALL play the active word clip via `audio.playWord(refWord.wordInLWC)`. Java reference: `Georgia.java:161` (`playActiveWordClip(false)`).

#### Scenario: Word audio plays at round start

- **WHEN** a new round begins
- **THEN** `audio.playWord(refWord.wordInLWC)` is invoked once

### Requirement: Correct Answer Handling

When the player taps the correct choice, the game SHALL:

- Reveal the stripped word text in the full-word text view.
- Call `shell.incrementPointsAndTracker(true)` (Java `updatePointsAndTrackers(1)` — 1 point).
- Make all choices non-clickable; recolor the non-correct visible choices `bg=#A9A9A9 fg=#000000`.
- Sequence audio: play correct chime, then replay the active word clip.
- Set advance arrow to blue.

Java reference: `Georgia.java:412–432`.

#### Scenario: Correct tap reveals word and scores 1

- **GIVEN** the player taps the correct choice
- **WHEN** the handler fires
- **THEN** the full-word text view becomes visible with `stripInstructionCharacters(refWord.wordInLOP)`
- **AND** `shell.incrementPointsAndTracker` is called with `true`

#### Scenario: Correct tap sequences correct chime then word audio

- **GIVEN** the correct choice is tapped
- **WHEN** the audio sequence runs
- **THEN** `audio.playCorrect()` is awaited before `shell.replayWord()` is invoked

### Requirement: Wrong Answer Handling

When the player taps a wrong choice, the game SHALL play the incorrect chime and track up to `visibleGameButtons - 1` distinct wrong texts in insertion order. Choices SHALL remain tappable until the correct one is picked. Java reference: `Georgia.java:432–438`.

#### Scenario: Wrong tap plays incorrect chime

- **GIVEN** the player taps a wrong choice
- **WHEN** the handler fires
- **THEN** `audio.playIncorrect()` is invoked AND the choice remains enabled

#### Scenario: Same wrong choice re-tapped is not double-tracked

- **GIVEN** the player taps the same wrong choice twice
- **WHEN** both taps fire
- **THEN** the wrong text appears once in `wrongPicks`

### Requirement: Image Tap Repeats Audio

Tapping the prompt image SHALL replay the active word clip via `shell.replayWord()`. Java reference: `Georgia.java:445 clickPicHearAudio → super.playActiveWordClip`.

#### Scenario: Image tap replays word audio

- **WHEN** the player taps the prompt image
- **THEN** `shell.replayWord()` is invoked

### Requirement: Container / Presenter Split

`<GeorgiaContainer>` SHALL own all state and hook usage. `<GeorgiaScreen>` SHALL be a pure props→JSX presenter with no hooks and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `GeorgiaScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
