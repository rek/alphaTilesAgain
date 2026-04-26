## ADDED Requirements

### Requirement: Board setup with tile pairs and randomized correct slot

The United States mechanic SHALL render a 2-row grid of N tile pairs, where N equals the parsed tile-length of the target word. Each pair contains one "top" tile (`button{nn}a`) and one "bottom" tile (`button{nn}b`). For every pair, exactly one tile shows the **correct** tile text from `parsedRefWordTileArray[parseIndex]`, and the other shows a **distractor** randomly drawn from that tile's `distractors` list (`rand.nextInt(Start.ALT_COUNT)`). The slot of the correct tile (top or bottom) SHALL be randomized per pair via `rand.nextInt(2)`. Ports `UnitedStates.java:172-223 onCreate/playAgain`.

#### Scenario: Round initialization

- **WHEN** `<UnitedStatesContainer>` starts a round
- **THEN** it picks a target word matching the `challengeLevel` length cap, parses it into tiles, and emits N pairs
- **AND** each pair has one correct tile and one distractor drawn from `tile.distractors[rand.nextInt(ALT_COUNT)]`
- **AND** the correct tile's slot (top vs bottom) is independently randomized per pair

#### Scenario: Layout slot count exceeds word length

- **GIVEN** `challengeLevel === 2` (layout exposes 7 button-pairs / 14 buttons) and the target word has 4 tiles
- **WHEN** the round renders
- **THEN** only the first 4 pairs are visible; pairs 5-7 are hidden (`View.INVISIBLE`) and emit empty text (Java line 215-220)

### Requirement: Challenge-level scales the word-length cap

The mechanic SHALL select a target word whose parsed tile length is `<= wordLengthLimitInTiles`, where the cap is determined by `challengeLevel` per `UnitedStates.java:73-91`:

- `challengeLevel === 1` (default) → `wordLengthLimitInTiles = 5`, layout `united_states_cl1`, `visibleGameButtons = 10` (5 pairs)
- `challengeLevel === 2` → `wordLengthLimitInTiles = 7`, layout `united_states_cl2`, `visibleGameButtons = 14` (7 pairs)
- `challengeLevel === 3` → `wordLengthLimitInTiles = 9`, layout `united_states_cl3`, `visibleGameButtons = 18` (9 pairs)

Java applies **no minimum**: `playAgain` loops `while (parsedLengthOfRefWord > wordLengthLimitInTiles) chooseWord();` (lines 130-134), so any 1-tile word is acceptable at every level.

#### Scenario: Level 1 caps word length at 5

- **WHEN** `challengeLevel === 1`
- **THEN** the picker rejects any word whose parsed tile length exceeds 5 and re-rolls (no lower bound)

#### Scenario: Level 3 allows up to 9 tiles

- **WHEN** `challengeLevel === 3` and a 9-tile word is picked
- **THEN** the round renders 9 pairs (18 tile buttons) and accepts that word

### Requirement: Tile selection toggles within a pair

Each pair SHALL behave as a radio group: tapping a tile selects it (theme color background, white text) and the other tile in that same pair SHALL be deselected (background `#A9A9A9` dark gray, text black). Selecting the other tile in the pair replaces the prior choice. The selected tile's color cycles through `colorList.get((selectionIndex / 2) % 5)`. Ports `UnitedStates.java:303-333 onBtnClick`.

#### Scenario: Tapping a tile deselects its pair-mate

- **GIVEN** the player has selected the top tile in pair 0
- **WHEN** the player taps the bottom tile in pair 0
- **THEN** the bottom tile becomes selected (theme color, white text), the top tile reverts to dark gray with black text, and `selections[topIdx]` is cleared to `""`

#### Scenario: Selection color cycles per pair index

- **WHEN** the player selects a tile in pair index `p`
- **THEN** the tile's background color is `colorList[(p) % 5]` (Java `colorList.get((selectionIndex / 2) % 5)`)

### Requirement: Constructed-word display with double-underscore placeholders

The mechanic SHALL render a constructed-word display above/below the grid. Initial state is N copies of `"__"` (double underscore), one per pair (Java line 229-231 `for (i = 0; i < numberOfPairs) initialDisplay += "__"`). After a tile selection in pair `p`, the display SHALL update by combining `tileSelections[]` (or the syllable selection array in syllable mode) into a single string via `combineTilesToMakeWord`. Pairs with no selection still render `"__"` placeholders within the constructed string. Ports `UnitedStates.java:227-279 buildWord` + `playAgain`.

#### Scenario: Initial display is N double-underscores

- **GIVEN** the target word has 3 tiles
- **WHEN** the round mounts
- **THEN** the constructed-word display shows `"______"` (three pairs of `"__"`)

#### Scenario: Partial selection shows mixed text and placeholders

- **GIVEN** target word `"cat"` parsed as `["c","a","t"]` and the player has selected `"c"` in pair 0 only
- **WHEN** the display refreshes
- **THEN** it shows `"c____"` (or the locale's equivalent — Java uses `combineTilesToMakeWord` which keeps placeholders for unselected pairs)

### Requirement: Win condition

After every selection, the constructed string SHALL be compared to `wordInLOPWithStandardizedSequenceOfCharacters(refWord)` (Java line 282). On equality:

- The advance arrow turns blue (`setAdvanceArrowToBlue()`, Java line 285).
- The constructed-word display turns dark green `#006400` and bold (Java line 286-287).
- `updatePointsAndTrackers(2)` is invoked (Java line 289) — fixed 2 points per win.
- All visible game tiles become unclickable (Java line 291-294).
- `playCorrectSoundThenActiveWordClip(false)` runs — correct chime followed by the active word audio. **Note:** Java passes `false`, NOT `true`, so the *final/celebration* fanfare is **not** played; this is plain correct + word audio.

#### Scenario: Selecting the last correct tile wins

- **GIVEN** the player has correct tiles selected in all but one pair
- **WHEN** the player taps the correct tile in the remaining pair
- **THEN** `shell.incrementPointsAndTracker(true)` (mapped from Java `updatePointsAndTrackers(2)`) is invoked
- **AND** the constructed-word display turns dark green and bold
- **AND** `audio.playCorrect()` plays followed by `audio.playWord(refWord.wordInLWC)`
- **AND** all tile buttons become unclickable until the next round

#### Scenario: Wrong word does not win

- **WHEN** the constructed string differs from the standardized target
- **THEN** the display stays black and non-bold and tiles remain clickable (Java line 297-300)

### Requirement: Precompute for word filtering

The mechanic SHALL register a precompute under key `'united-states'` via `util-precompute`. The builder SHALL bucket `wordList` by the `wordLengthLimitInTiles` cap of each challenge level so round initialization avoids re-parsing every word.

```ts
type UnitedStatesData = {
  level1Words: Word[]; // parsedTileLength <= 5
  level2Words: Word[]; // parsedTileLength <= 7
  level3Words: Word[]; // parsedTileLength <= 9
};
```

#### Scenario: Boot-time precomputation

- **WHEN** the app boots
- **THEN** `buildUnitedStatesData(assets)` is invoked once and the bucketed word list is cached for `usePrecompute('united-states')` consumers

### Requirement: Container/presenter split

`<UnitedStatesContainer>` SHALL own all hook usage (i18n, precompute, shell context, state). `<UnitedStatesScreen>` SHALL be a pure props→JSX presenter with no `useTranslation` or `useGameShell` calls; all data and callbacks SHALL flow as props.

#### Scenario: Presenter audit

- **WHEN** `UnitedStatesScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next` and MUST NOT call `useGameShell` — content (tile texts, constructed string, image URI) and callbacks (`onTilePress`) come from props
