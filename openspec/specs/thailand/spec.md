# Capability: Thailand Game

Thailand is a fixed 4-choice identification game where a reference item (tile, word, or syllable — in text, image, or audio form) is matched to one of four choice buttons. The mechanic is heavily parameterised via a 3-digit `challengeLevel` code XYZ where X = distractor strategy, Y = refType index, Z = choiceType index.

## ADDED Requirements

### Requirement: Challenge Level Decoding

The container SHALL decode the 3-digit `challengeLevel` per Java `Thailand.java:80-87`. The hundreds digit MUST become `distractorStrategy ∈ {1,2,3}`. The tens digit MUST 1-index into `TYPES` to pick `refType`. The units digit MUST 1-index into `TYPES` to pick `choiceType`. `TYPES` is the 8-entry tuple from `Thailand.java:26-27`: `[TILE_LOWER, TILE_UPPER, TILE_AUDIO, WORD_TEXT, WORD_IMAGE, WORD_AUDIO, SYLLABLE_TEXT, SYLLABLE_AUDIO]`.

#### Scenario: Decoding CL 235

- **GIVEN** `challengeLevel === 235`
- **WHEN** the container mounts
- **THEN** `distractorStrategy === 2`
- **AND** `refType === 'TILE_AUDIO'` (TYPES[2])
- **AND** `choiceType === 'WORD_IMAGE'` (TYPES[4])

### Requirement: Always Four Choices

The screen SHALL always render exactly 4 choice buttons (1 correct + 3 distractors), regardless of `challengeLevel`. Java reference: `Thailand.java:41-43 GAME_BUTTONS`, `113 visibleGameButtons = 4`.

#### Scenario: Choice count is always 4

- **GIVEN** any valid `challengeLevel`
- **WHEN** a round is set up
- **THEN** `choices.length === 4`

### Requirement: Reference Item Rendering

The reference item SHALL be rendered per `refType` matching Java `Thailand.java:291-320`:

- `TILE_LOWER` / `TILE_UPPER` / `SYLLABLE_TEXT` MUST render the relevant text on a `refColor` background with white text.
- `WORD_TEXT` MUST render `stripInstructionCharacters(refWord.wordInLOP)` on a white background with black text.
- `WORD_IMAGE` MUST render the drawable resolved from `refWord.wordInLWC`.
- `TILE_AUDIO` / `WORD_AUDIO` / `SYLLABLE_AUDIO` MUST render the corresponding "click for audio" icon and no text.

`refColor` MUST be a per-round random pick from the first 4 entries of `colorList` (Java line 140 `rand.nextInt(4)`).

#### Scenario: WORD_IMAGE reference

- **GIVEN** `refType === 'WORD_IMAGE'`
- **WHEN** a round starts
- **THEN** the reference area shows the word's image and no overlaid text

#### Scenario: TILE_LOWER reference uses refColor

- **GIVEN** `refType === 'TILE_LOWER'` and the round picks `refColor === '#3399FF'`
- **WHEN** the screen renders
- **THEN** the reference background is `#3399FF` and the tile text is white

### Requirement: Reference Audio Auto-Play On Round Start

When a round begins, the container SHALL play the reference audio per `refType` per Java `Thailand.java:399-416`:

- TILE_* → `playActiveTileClip(false)`.
- WORD_* → `playActiveWordClip(false)`.
- SYLLABLE_TEXT / SYLLABLE_AUDIO → `playActiveSyllableClip(false)` only when `hasSyllableAudio` is true.

#### Scenario: Word audio auto-plays for WORD_IMAGE

- **GIVEN** `refType === 'WORD_IMAGE'`
- **WHEN** a round starts
- **THEN** the active word audio plays once

### Requirement: Reference Tile Picking And Freshness

When the reference is a tile (TILE_*), the container SHALL pick the ref via the rules in Java `Thailand.java:146-290`:

- Word-based ref or word-based choice paths use `chooseWord()` + `firstAudibleTile(refWord)` (Java 146-211).
- Standalone tile picks draw uniformly from `tileListNoSAD`; for TILE_LOWER/TILE_AUDIO the chosen tile MUST be a consonant or vowel (`CorV`, Java 252).
- When `distractorStrategy === 1`, ref tiles whose `typeOfThisTileInstance` matches `T|AD|D|PC` (or `T|AD|C|PC` for the TILE_LOWER standalone path, Java 258) MUST be rejected and re-picked.
- The freshness guard `verifyFreshTile` (Java 424-435) MUST reject any ref string equal (case-insensitive) to any of the previous 3 ref strings, until 25 retry attempts have elapsed.

#### Scenario: CL1 disallows tone-mark reference

- **GIVEN** `distractorStrategy === 1` and the first picked tile has `typeOfThisTileInstance === 'T'`
- **WHEN** the picker runs
- **THEN** that tile is rejected and another tile is drawn

#### Scenario: Last-three anti-repeat

- **GIVEN** the previous three rounds used ref strings `["a","b","c"]`
- **WHEN** the next round picks a candidate equal to `"a"`
- **THEN** the candidate is rejected unless `freshChecks > 25`

### Requirement: First Audible Tile Algorithm

Both ref-tile picking from a word AND match-checking SHALL use `firstAudibleTile(Word)` from Java `Thailand.java:633-646`. Starting from the first parsed tile, the algorithm MUST advance past any tile that is `LV` followed by a non-`PC` tile, or whose type matches `PC|AD|D|T`, until it finds an audible tile.

#### Scenario: Skips leading diacritic

- **GIVEN** a parsed word `[<AD>, <C>, <V>]`
- **WHEN** `firstAudibleTile` runs
- **THEN** it returns the `<C>` tile

### Requirement: Distractor Pool Dispatch

The container SHALL pick the distractor pool by `(choiceType, refType)` per Java `Thailand.java:322-335`:

- `choiceType ∈ {TILE_LOWER, TILE_UPPER}` → `tileListNoSAD.returnFourTileChoices(refTile, distractorStrategy, refTileType)`.
- `choiceType ∈ {WORD_TEXT, WORD_IMAGE}` AND `refType` does not contain `SYLLABLE` → `wordList.returnFourWords(refWord, refTile, distractorStrategy, refType)`.
- `refType` contains `SYLLABLE` AND `choiceType` contains `WORD` → `syllableList.returnFourWordChoices(refString, distractorStrategy)`.
- `refType` contains `SYLLABLE` AND `choiceType` contains `SYLLABLE` → `syllableList.returnFourSyllableChoices(refString, distractorStrategy)`.

#### Scenario: Syllable ref with Word_Text choice

- **GIVEN** `refType === 'SYLLABLE_AUDIO'` and `choiceType === 'WORD_TEXT'`
- **WHEN** the round builds choices
- **THEN** `syllableList.returnFourWordChoices(refString, distractorStrategy)` is invoked

### Requirement: Correct Selection Handling

When the player taps the correct choice, the container SHALL (per Java `Thailand.java:563-616`):

- Call `updatePointsAndTrackers(1)` (mapped to `shell.incrementPointsAndTracker(true)`).
- Set all 4 buttons non-clickable.
- If `choiceType !== 'WORD_IMAGE'`: set the correct button background to `refColor` and text to white.
- If `choiceType === 'WORD_IMAGE'`: set the 3 non-correct button backgrounds to white.
- Sequence audio by `refType`: `playCorrectSoundThenActiveTileClip` for TILE_*, `playCorrectSoundThenActiveWordClip` for WORD_*, `playCorrectSoundThenActiveSyllableClip` for SYLLABLE_* (or `playCorrectSound` alone if `!hasSyllableAudio`).

The match comparison logic SHALL follow the (choiceType × refType) switch in Java `Thailand.java:474-561`. In particular, when `choiceType ∈ {WORD_TEXT, WORD_IMAGE}` and `refType ∈ {TILE_LOWER, TILE_AUDIO}`, both `firstAudibleTile(chosenWord).text === refItemText` AND `typeOfThisTileInstance === refTileType` MUST hold (Java 524-527).

#### Scenario: Correct tap scores and locks

- **GIVEN** the player taps the correct choice in a TILE_LOWER → TILE_LOWER round
- **WHEN** the handler fires
- **THEN** `shell.incrementPointsAndTracker(true)` is called
- **AND** all 4 buttons become non-clickable
- **AND** the correct button background becomes `refColor` with white text

#### Scenario: WORD_IMAGE correct tap whitens others

- **GIVEN** `choiceType === 'WORD_IMAGE'` and the player taps the correct image
- **WHEN** the handler fires
- **THEN** the other 3 image buttons get white backgrounds

#### Scenario: WORD choice with TILE ref requires type parity

- **GIVEN** `refType === 'TILE_LOWER'`, `refTileType === 'V'`, and the chosen word's first audible tile has text matching `refItemText` but `typeOfThisTileInstance === 'C'`
- **WHEN** the match comparison runs
- **THEN** `goodMatch === false`

### Requirement: Incorrect Selection Handling

When the player taps a wrong choice, the container SHALL (per Java `Thailand.java:618-630`):

- Play the incorrect sound.
- Increment `incorrectOnLevel`.
- Append the chosen text to `incorrectAnswersSelected` if not already present, capped at 3 distinct entries.
- Leave all choice buttons clickable so the player can retry.

#### Scenario: Wrong tap retries

- **GIVEN** the player taps a non-correct choice
- **WHEN** the handler fires
- **THEN** the incorrect chime plays
- **AND** all 4 buttons remain tappable

#### Scenario: Distinct wrong-answer tracking

- **GIVEN** the player has already tapped the same wrong choice twice
- **WHEN** they tap that same wrong choice a third time
- **THEN** `incorrectAnswersSelected` still contains exactly one entry for that text

### Requirement: Reference Audio Replay On Tap

Tapping the reference item SHALL replay its audio per Java `Thailand.java:652-672`:

- TILE_* → `playActiveTileClip(false)`.
- WORD_* → `playActiveWordClip(false)`.
- SYLLABLE_TEXT / SYLLABLE_AUDIO → `playActiveSyllableClip(false)` only if `hasSyllableAudio`.

#### Scenario: Tap audio icon replays tile audio

- **GIVEN** `refType === 'TILE_AUDIO'`
- **WHEN** the player taps the reference area
- **THEN** the active tile audio plays again

### Requirement: Layout Variant For Word_Text Choices

When `choiceType === 'WORD_TEXT'` the screen SHALL use the `thailand2` layout variant; otherwise the standard `thailand` layout. Java reference: `Thailand.java:89-96`.

#### Scenario: WORD_TEXT picks larger layout

- **GIVEN** `choiceType === 'WORD_TEXT'`
- **WHEN** the screen mounts
- **THEN** the larger 4-button layout (thailand2) is used

### Requirement: Container / Presenter Split

`<ThailandContainer>` SHALL own all hooks (`useGameShell`, `useLangAssets`, `useTranslation`), challenge-level decoding, ref/choice picking, audio sequencing, and incorrect-answer tracking. `<ThailandScreen>` SHALL be a pure props→JSX presenter.

#### Scenario: Presenter audit

- **WHEN** `ThailandScreen.tsx` is statically inspected
- **THEN** it imports neither `react-i18next` nor any `useGameShell`/`useLangAssets` hook
