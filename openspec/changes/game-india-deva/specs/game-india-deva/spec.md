# Capability: game-india-deva

Stroke-order tracing game for Devanagari aksharas. Mirror of `game-taiwan` mechanic; player drags through each character's strokes in correct order; OSS lib (`@jamsch/react-native-hanzi-writer`) scores against expected path.

**Phase 1 (this change):** Capability defined; library not yet built. Phase 1 ships only the data extractor + spike route. Phase 3 implements the lib + route + menu gating.

## ADDED Requirements

### Requirement: Round Composition

The game SHALL render one target akshara at a time. A round SHALL consist of exactly `goalCount` characters (default `5`). Characters SHALL be drawn from `availableTiles` — the precomputed list of stage tiles for which Devanagari stroke data is present in `assets.strokes`.

This requirement is identical to `game-taiwan`; the only difference is the source data corpus (Devanagari vs hanzi).

#### Scenario: Round picks 5 stroke-eligible aksharas
- **GIVEN** the active pack has `availableTiles.length === 12`
- **WHEN** the container mounts
- **THEN** exactly 5 aksharas are picked for the round
- **AND** every picked akshara has a non-null entry in `assets.strokes`

### Requirement: Insufficient Content Handling

When `availableTiles.length === 0`, the screen SHALL render a friendly insufficient-content message with a back-to-menu control.

#### Scenario: Pack has no Devanagari stroke data
- **GIVEN** `assets.strokes` is empty (e.g. non-Devanagari pack)
- **WHEN** `<IndiaDevaContainer>` mounts
- **THEN** the screen renders the insufficient-content state and no `<HanziWriter />` instance is created

### Requirement: Challenge-Level Decoding

The container SHALL decode `challengeLevel` into the same three-tier table as `game-taiwan` (D4):

| CL | `<HanziWriter.Outline>` | `<HanziWriter.Character>` | `quiz.start({leniency})` |
|---|---|---|---|
| 1 (default) | yes | yes | `1.5` |
| 2 | yes | no | `1.0` |
| 3 | no | no | `0.7` |

Unknown CL SHALL fall through to CL1.

### Requirement: Stroke Lifecycle Events

Same as `game-taiwan`:
- `quiz.start({ leniency, showHintAfterMisses: 3, onMistake, onComplete })`.
- `onComplete({ totalMistakes, character })` MUST call `shell.incrementPointsAndTracker(true, strokeCount)`.
- The 3-mistake hint is rendered automatically by `<HanziWriter.QuizMistakeHighlighter />`.

### Requirement: Web SSR Safety

The container SHALL dynamically import `@jamsch/react-native-hanzi-writer` inside `useEffect` to avoid the Node-SSR TDZ on `getPathString` (see `openspec/changes/game-taiwan/STATUS.md` for the root cause).

### Requirement: Container/Presenter Split

`IndiaDevaScreen` SHALL be a pure props→JSX component. It MUST NOT import `react-i18next`, `useGameShell`, or any data hook. All translated strings MUST be passed as props. (Same rule as `TaiwanScreen`.)

### Requirement: Route Registration

`apps/alphaTiles/app/games/india-deva.tsx` SHALL render `<IndiaDevaContainer />` with `challengeLevel` parsed from the route params. Phase 3 only — no route in Phase 1.
