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

The container SHALL decode `challengeLevel` into three knobs passed to `<HanziWriter />`:

| CL | `showOutline` | `showCharacter` (start dots / numbered guides) | `leniency` |
|---|---|---|---|
| 1 (default) | `true` | `true` | `1.5` |
| 2 | `true` | `false` | `1.0` |
| 3 | `false` | `false` | `0.7` |

Unknown CL SHALL fall through to CL1 behaviour.

#### Scenario: CL 1 enables full guidance
- **GIVEN** `challengeLevel === 1`
- **WHEN** the screen renders
- **THEN** the writer is configured with `showOutline=true`, `showCharacter=true`, `leniency=1.5`

#### Scenario: CL 3 enables blank-canvas mode
- **GIVEN** `challengeLevel === 3`
- **WHEN** the screen renders
- **THEN** the writer is configured with `showOutline=false`, `showCharacter=false`, `leniency=0.7`

#### Scenario: Unknown CL falls through
- **GIVEN** `challengeLevel === 99`
- **WHEN** the screen renders
- **THEN** the writer is configured per CL1

### Requirement: Stroke Lifecycle Events

The container SHALL handle these `<HanziWriter />` events:

- `onMistake({ strokeNum })` MUST increment a per-character `mistakeCount` ref. After 3 mistakes within one character the container MUST call `writer.highlightStroke(strokeNum)` to hint the expected stroke. No point penalty beyond the mistake counter.
- `onCorrectStroke` MUST be a no-op in v1 (no chime).
- `onComplete({ totalMistakes })` MUST call `shell.incrementPointsAndTracker(true, strokeCount)` where `strokeCount === assets.strokes[char].strokes.length`. Then `shell.audio.playWord(char)` plays the character audio. The container then advances to the next character in the round.

#### Scenario: Successful character grants stroke-count points
- **GIVEN** the current character `"生"` has 5 strokes
- **WHEN** the player completes the character with no mistakes
- **THEN** `incrementPointsAndTracker` is called with `(true, 5)`

#### Scenario: 3 mistakes triggers hint
- **GIVEN** the current character has been mis-stroked twice
- **WHEN** the player makes a third mistake
- **THEN** `writer.highlightStroke` is invoked with the current stroke number
- **AND** the round does NOT advance to the next character

#### Scenario: Round advances after each character
- **GIVEN** the round has 5 characters and the player just completed the 2nd
- **WHEN** `onComplete` fires
- **THEN** the screen renders the 3rd character and resets `mistakeCount` to 0

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
