# Capability: game-taiwan

Taiwan is a stroke-order tracing game. The player traces each stroke of a target Chinese character in correct order, scored by the upstream `@jamsch/react-native-hanzi-writer` quiz mode. This is the first non-Java-port mechanic in the catalogue.

## ADDED Requirements

### Requirement: Round Composition

The game SHALL render one target hanzi at a time. A round SHALL consist of exactly `goalCount` characters (default `5`). Characters SHALL be drawn from `availableTiles` — the precomputed list of stage tiles for which stroke data is present in `assets.strokes`.

#### Scenario: Round picks 5 stroke-eligible characters
- **GIVEN** the active pack has `availableTiles.length === 12`
- **WHEN** the container mounts
- **THEN** exactly 5 characters are picked for the round
- **AND** every picked character has a non-null entry in `assets.strokes`

#### Scenario: Round picks unique characters
- **GIVEN** `availableTiles.length >= goalCount`
- **WHEN** characters are picked
- **THEN** the picked list contains no duplicates

#### Scenario: Compound tile decomposition
- **GIVEN** a tile glyph `"醫生"` whose individual chars `"醫"` and `"生"` both have stroke data
- **WHEN** `availableTiles` is built
- **THEN** both `"醫"` and `"生"` appear independently in `availableTiles`

### Requirement: Insufficient Content Handling

When `availableTiles.length === 0`, the screen SHALL render a friendly insufficient-content message with a back-to-menu control. The screen SHALL NOT crash, throw, or run a partial round.

#### Scenario: Pack has no stroke data
- **GIVEN** `assets.strokes` is empty (e.g. non-Chinese pack)
- **WHEN** `<TaiwanContainer>` mounts
- **THEN** the screen renders the insufficient-content state and no `<HanziWriter />` instance is created

### Requirement: Challenge-Level Decoding

The container SHALL decode `challengeLevel` into three configuration switches:

| CL | `<HanziWriter.Outline>` rendered | `<HanziWriter.Character>` rendered | `quiz.start({leniency})` |
|---|---|---|---|
| 1 (default) | yes | yes | `1.5` |
| 2 | yes | no | `1.2` |
| 3 | yes | no | `1.0` |

The outline guide SHALL be rendered at every challenge level. A fully blank canvas combined with strict matching (the original CL3 = no outline + `leniency 0.7`) left learners with no reference and was unusable (issue #31). Difficulty scales by character-fill (CL1 shows the filled glyph; CL2/CL3 show outline only) and matching leniency, never by removing all guidance.

`<HanziWriter />` exposes outline + character + grid-lines as compositional **children** (not props). The presenter SHALL render or omit `<HanziWriter.Outline />` and `<HanziWriter.Character />` per the table.

`leniency` SHALL be passed to `quiz.start(...)` (not to `useHanziWriter`).

Unknown CL SHALL fall through to CL1 behaviour.

#### Scenario: CL 1 enables full guidance
- **GIVEN** `challengeLevel === 1`
- **WHEN** the screen renders
- **THEN** both `<HanziWriter.Outline>` and `<HanziWriter.Character>` are rendered as children
- **AND** the container starts the quiz with `leniency: 1.5`

#### Scenario: CL 3 keeps the outline guide with strict matching
- **GIVEN** `challengeLevel === 3`
- **WHEN** the screen renders
- **THEN** `<HanziWriter.Outline>` is rendered but `<HanziWriter.Character>` is not
- **AND** the container starts the quiz with `leniency: 1.0`

#### Scenario: Unknown CL falls through
- **GIVEN** `challengeLevel === 99`
- **WHEN** the screen renders
- **THEN** the writer is configured per CL1

### Requirement: Stroke Lifecycle Events

The container SHALL configure the upstream quiz via `quiz.start({ leniency, showHintAfterMisses, onMistake, onComplete })`:

- `showHintAfterMisses: 3` — after 3 mistakes on the current stroke the upstream renders the expected stroke via the `<HanziWriter.QuizMistakeHighlighter />` child rendered inside `<HanziWriter.Svg>`. The hint mechanism is configured at quiz-start, NOT invoked imperatively. There is no `writer.highlightStroke` method in v1.2.
- `onMistake(strokeData)` MUST increment a per-character `mistakeCount` ref for diagnostics / analytics. No point penalty beyond the mistake counter.
- `onCorrectStroke` MUST be a no-op in v1 (no chime).
- `onComplete({ totalMistakes, character })` MUST call `shell.incrementPointsAndTracker(true, strokeCount)` where `strokeCount === assets.strokes[char].strokes.length`. Then `shell.audio.playWord(char)` plays the character audio. The container then advances to the next character in the round.

The `<HanziWriter.QuizMistakeHighlighter />` child MUST be rendered inside `<HanziWriter.Svg>` so the hint is visible when the threshold trips.

#### Scenario: Successful character grants stroke-count points
- **GIVEN** the current character `"生"` has 5 strokes
- **WHEN** the player completes the character with no mistakes
- **THEN** `incrementPointsAndTracker` is called with `(true, 5)`

#### Scenario: 3 mistakes triggers hint via upstream highlighter
- **GIVEN** `quiz.start` was invoked with `showHintAfterMisses: 3`
- **AND** the current character has been mis-stroked twice
- **WHEN** the player makes a third mistake
- **THEN** the upstream `<QuizMistakeHighlighter />` renders the expected stroke automatically
- **AND** the round does NOT advance to the next character

#### Scenario: Round advances after each character
- **GIVEN** the round has 5 characters and the player just completed the 2nd
- **WHEN** `onComplete` fires
- **THEN** the screen renders the 3rd character and resets `mistakeCount` to 0

### Requirement: Completion Success Pause

On character completion the container SHALL hold on the completed character for a brief pause (~900 ms), rendering the full glyph filled (success color) before advancing to the next character. This guarantees the learner sees the finished character — the upstream resets `quiz.index` to `0` the instant the last stroke matches, which otherwise blanks single-stroke characters (e.g. `一`) and makes multi-stroke characters disappear before the next one mounts (issue #31).

The pause SHALL be driven by a single-slot timer ref, cleared on advance (manual skip or pause completion) and on unmount, per the timer-ref hygiene pattern. During the pause the drawing surface is inert (the upstream quiz is inactive).

#### Scenario: Single-stroke character is shown before advancing
- **GIVEN** the current character is `"一"` (1 stroke)
- **WHEN** the player completes it
- **THEN** the full glyph is rendered filled for the success pause
- **AND** the round advances only after the pause elapses

#### Scenario: Skip during the pause cancels the timer
- **GIVEN** a success pause is in progress
- **WHEN** the player taps the advance arrow
- **THEN** the pending advance timer is cleared and the round advances exactly once

### Requirement: Clear Control

The presenter SHALL render a "Clear" control that restarts the current character's quiz (resetting drawn strokes and mistake count) without changing the character or advancing the round. The control SHALL be disabled during the success pause.

#### Scenario: Clear resets the current character
- **GIVEN** the player has drawn two correct strokes of a 5-stroke character
- **WHEN** the player taps "Clear"
- **THEN** the quiz restarts at stroke 0 with the same character and the drawn strokes are removed

### Requirement: Character Audio On Completion

When a character is completed, the container SHALL play tile audio for the character. If the pack has no per-character audio (because audio is per-compound), the container SHALL fall back to playing the audio of the first compound that contains this character.

#### Scenario: Per-character audio plays when available
- **GIVEN** the current character is `"醫"` and `assets.tileAudio["醫"]` exists
- **WHEN** the character is completed
- **THEN** `audio.playWord("醫")` is invoked

#### Scenario: Compound audio fallback
- **GIVEN** the current character is `"醫"`, no per-character audio exists, but `"醫生"` is a tile with audio
- **WHEN** the character is completed
- **THEN** the audio of `"醫生"` is played

### Requirement: Container/Presenter Split

`TaiwanScreen` SHALL be a pure props→JSX component. It MUST NOT import `react-i18next`, `useGameShell`, or any data hook. All translated strings MUST be passed as props.

#### Scenario: Presenter is hook-free
- **WHEN** the file `TaiwanScreen.tsx` is statically analysed
- **THEN** it imports neither `react-i18next` nor any `data-*` library

### Requirement: Route Registration

`apps/alphaTiles/app/games/taiwan.tsx` SHALL render `<TaiwanContainer />` with `challengeLevel` parsed from the route params, and pass any other props the shell expects.

#### Scenario: Route renders the container
- **WHEN** the user navigates to `/games/taiwan?challengeLevel=2`
- **THEN** `<TaiwanContainer challengeLevel={2} />` mounts
