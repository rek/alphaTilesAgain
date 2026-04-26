## ADDED Requirements

### Requirement: 8-Tile Scatter Round

The Ecuador mechanic SHALL render exactly 8 word tiles scattered at random non-overlapping positions, plus a prompt header showing the reference word's image (variant-2: `<wordInLWC>2.png`) and stripped LOP text. This ports `Ecuador.java:78–276 onCreate/setBoxes` and `:331–347 setWords`.

#### Scenario: Fresh round rendering

- **GIVEN** a language pack with at least 9 words in `cumulativeStageBasedWordList`
- **WHEN** `<EcuadorContainer>` mounts
- **THEN** the screen renders 8 scatter tiles plus a prompt image and prompt label

#### Scenario: Insufficient content

- **WHEN** `wordPool.length < 9` OR placement fails after 5 outer restarts
- **THEN** the screen renders an empty/locked state and no tiles are interactive

### Requirement: Word-Pool Shuffle Then Overwrite

Each round SHALL shuffle a copy of `cumulativeStageBasedWordList`, take entry 0 as `refWord` (the prompt), assign tile slots 0..7 to entries 1..8, then OVERWRITE one tile slot at random index `correctSlot = floor(rng() * 8)` with the prompt's stripped LOP text. Java reference: `Ecuador.java:332–346`.

#### Scenario: Correct tile equals stripped prompt text

- **GIVEN** the prompt's stripped LOP text is `"cat"`
- **WHEN** the round is composed
- **THEN** exactly one tile slot index equals `correctSlot` and renders `"cat"`

#### Scenario: Tile slots use entries 1..8 (not 1..7)

- **GIVEN** a shuffled pool of 9+ words
- **WHEN** `pickRound` runs
- **THEN** tile slots 0..7 receive `shuffled[1]..shuffled[8]` (before the correctSlot overwrite)

### Requirement: Duplicate Tiles Not Filtered (Java Parity)

The mechanic SHALL NOT deduplicate tile texts. Java's `setWords` does not check for duplicates (per the JP TODO comment at `Ecuador.java:32`); two tiles MAY display identical stripped LOP strings, including the prompt text.

#### Scenario: Pool word equals prompt LOP — both tiles show same text

- **GIVEN** `shuffled[3].wordInLOP (stripped) == prompt.wordInLOP (stripped)`
- **WHEN** the round renders
- **THEN** both tile slot 2 (entry index 3) and `correctSlot` display the same text, and tapping either is treated as correct

### Requirement: Non-Overlapping Random Placement

Tiles MUST be placed at random positions and widths such that no two tiles' buffered bounding boxes overlap. Per-tile placement MAY retry up to 10 000 attempts; on the 10 001st failure, the algorithm MUST reset the entire layout (Java `currentBoxIndex = 0; extraLoops = 0`). The implementation SHALL cap outer restarts at 5; on cap, the round MUST be marked insufficient-content. Java reference: `Ecuador.java:179–256`.

#### Scenario: Tile rectangles do not overlap

- **GIVEN** 8 tiles placed by the algorithm
- **WHEN** any two tile rectangles are compared
- **THEN** their bounding boxes (each expanded by bufferX = 5% width and bufferY = 5% height) do not intersect

#### Scenario: Tile bounds do not exceed maxX2/maxY2

- **GIVEN** any placed tile
- **WHEN** its `coordX2 = coordX1 + boxWidth` and `coordY2 = coordY1 + boxWidth/4` are computed
- **THEN** `coordX2 <= usableWidth` AND `coordY2 <= usableHeight * 0.85`

#### Scenario: Per-tile retry cap then outer reset

- **GIVEN** a candidate placement fails non-overlap or out-of-bounds checks
- **WHEN** retried 10 000 times for the same slot
- **THEN** the algorithm resets `currentBoxIndex` to 0 and resumes placement

### Requirement: Tile Sizing Constants (Java Parity)

Tile width SHALL be drawn uniformly from `[usableWidth * 0.25, usableWidth * 0.50]`. Tile height SHALL equal `boxWidth / 4` (Java `hwRatio = 4`). Tile X start SHALL be drawn from `[0, usableWidth * 0.65]`. Tile Y start SHALL be drawn from `[usableHeight * 0.22, usableHeight * 0.75]`. Java reference: `Ecuador.java:152–186`.

#### Scenario: Tile width is within 25–50% of usable width

- **GIVEN** any placed tile
- **THEN** `usableWidth * 0.25 <= tile.width <= usableWidth * 0.50`

#### Scenario: Tile height equals width/4

- **GIVEN** any placed tile
- **THEN** `tile.height == Math.floor(tile.width / 4)`

### Requirement: Tile Color Cycle

Tile background colors SHALL cycle through `colors.hexByIndex[i % 5]` for tile index `i ∈ [0, 8)`. Tile text color SHALL be `#FFFFFF`. Java reference: `Ecuador.java:320–329`.

#### Scenario: Color cycle wraps at 5

- **GIVEN** the language pack's `colorList` has at least 5 entries
- **WHEN** the 8 tiles render
- **THEN** tile slot 0 and tile slot 5 share the same background color

### Requirement: Correct Answer Handling

When the player taps a tile whose text equals `stripInstructionCharacters(refWord.wordInLOP)`, the game SHALL:

- Call `shell.incrementPointsAndTracker(true)` (Java `updatePointsAndTrackers(2)` — 2 points).
- Make all 8 tiles non-clickable; recolor the 7 non-correct tiles `bg=#A9A9A9 fg=#000000`.
- Sequence audio: play correct chime, then replay the active word clip.
- Set advance arrow to blue.

Java reference: `Ecuador.java:393–428 respondToWordSelection` (correct branch).

#### Scenario: Correct tap grays others and scores 2

- **GIVEN** the player taps the tile matching the stripped prompt text
- **WHEN** the handler fires
- **THEN** the 7 non-correct tiles render `#A9A9A9` background and `#000000` text
- **AND** `shell.incrementPointsAndTracker` is called with `true`

#### Scenario: Correct tap sequences correct chime then word audio

- **GIVEN** the correct tile is tapped
- **WHEN** the audio sequence runs
- **THEN** `audio.playCorrect()` is awaited before `shell.replayWord()` is invoked

### Requirement: Wrong Answer Handling

When the player taps a non-correct tile, the game SHALL play the incorrect chime and track up to 7 distinct wrong texts in insertion order (Java `incorrectAnswersSelected`, capacity `visibleGameButtons - 1`). Tiles SHALL remain tappable for retry until the correct one is picked. Java reference: `Ecuador.java:430–441`.

#### Scenario: Wrong tap plays incorrect chime and is tracked

- **GIVEN** the player taps a wrong tile with text `"foo"`
- **WHEN** the handler fires
- **THEN** `audio.playIncorrect()` is invoked AND `"foo"` is appended to `wrongPicks` if not already present (cap 7)

#### Scenario: Same wrong tile re-tapped is not double-tracked

- **GIVEN** the player taps the same wrong tile twice
- **WHEN** both taps fire
- **THEN** `wrongPicks` contains `"foo"` exactly once

### Requirement: Image Tap Repeats Audio

Tapping the prompt image SHALL replay the active word clip via `shell.replayWord()`. Java reference: `Ecuador.java:449 clickPicHearAudio → super.playActiveWordClip`.

#### Scenario: Image tap replays word audio

- **WHEN** the player taps the prompt image
- **THEN** `shell.replayWord()` is invoked

### Requirement: No Challenge Level / Syllable Variation

The mechanic SHALL NOT vary with `challengeLevel` or `syllableGame`. There is no precompute and no syllable mode. Java references challengeLevel only for analytics tag composition (`Ecuador.java:401–402`).

#### Scenario: Same mechanic regardless of CL/syllable

- **WHEN** the route mounts with any `challengeLevel` or `syllableGame` value
- **THEN** the round composition and placement logic are unchanged

### Requirement: Container / Presenter Split

`<EcuadorContainer>` SHALL own all state and hook usage. `<EcuadorScreen>` SHALL be a pure props→JSX presenter with no hooks (other than `useWindowDimensions` for placement area) and no `react-i18next` import.

#### Scenario: Presenter has no i18n imports

- **WHEN** `EcuadorScreen.tsx` is statically analyzed
- **THEN** it MUST NOT import `react-i18next`
