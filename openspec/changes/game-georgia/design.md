## Context

`Georgia.java` is a first-sound identification game. Player taps the tile/syllable that begins the prompt word. CL controls choice count (6/12/18) and difficulty band; CL7–12 use a "first non-LV tile" target (relevant for Thai/Lao).

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Georgia.java`. `Start.java` for `CorV`/`tileHashMap`/`syllableHashMap`.

## Goals / Non-Goals

**Goals:**
- 12 tile CLs + 6 syllable CLs.
- Correct-tile derivation per CL band: simple first-tile vs. first-non-LV-tile.
- Word filter: starts with C or V.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Audio of the isolated first sound.
- New CL semantics not present in Java.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `parsedRefWordTileArray` | `parsedTiles: string[]` | |
| `parsedRefWordSyllableArray` | `parsedSyllables: string[]` (when S) | |
| `initialTile` | `correct: string` state | first tile (CL1–6) or first non-LV (CL7–12) |
| `CorV` | `corV: Tile[]` (precompute) | C and V tiles only |
| `tileHashMap.get(tile).distractors` | distractor list per tile | |
| `syllableHashMap.get(syl).distractors` | distractor list per syllable | |
| `setUpTiles()` / `setUpSyllables()` | `buildChoices(level, variant, correct, pool, distractors)` pure fn | Per-CL builder |
| `respondToTileSelection()` | `onChoice(text)` handler | |
| `updatePointsAndTrackers(1)` | `incrementPointsAndTracker(1)` | On correct only |

### D2. Visible Choice Count

```ts
function visibleChoices(level: number): 6|12|18 {
  const band = ((level - 1) % 6) + 1;
  return band <= 3 ? 6 : (level % 3 === 2 ? 12 : 18); // simplification:
}
// Cleaner:
function countForLevel(level: number): 6|12|18 {
  const m = ((level - 1) % 3);
  return m === 0 ? 6 : m === 1 ? 12 : 18;
}
```

### D3. Correct Tile Derivation

| CL band | Variant | `correct` |
|---|---|---|
| 1–6 | T | `parsedTiles[0]` |
| 7–12 | T | first tile in `parsedTiles` whose type is not `LV`. If `parsedTiles[0]` is `PC`, use the LV that immediately preceded it (per Java). |
| 1–6 | S | `parsedSyllables[0]` |

### D4. Choice Pool per CL Band

| CL band | Pool composition |
|---|---|
| Easy (1–3, T) | random sample of `corV` size N including `correct` |
| Easy (7–9, T) | random sample of `corV` size N including `correct` |
| Easy (1–3, S) | random sample of `syllableList` size N including `correct` |
| Hard (4–6, T) | `correct` + distractor trio of `correct` + tiles sharing first chars; pad/truncate to N |
| Hard (10–12, T) | same as hard but with first-non-LV target |
| Hard (4–6, S) | `correct` + syllable distractor trio + syllables with similar prefix; pad/truncate to N |

Where `N = countForLevel(level)`.

### D5. Word Filter

`chooseWord` MUST be retried until the parsed word starts with a tile in the `CorV` list. For S, the word filter still applies (parse via tiles to validate, then index syllables).

### D6. Container / Presenter Split

**`<GeorgiaContainer>`** — owns:
- `usePrecompute('georgia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `prompt`, `choices`, `correct`, `revealed`, `wrongPicks`.
- Handlers: `onChoice`, `onPlayAgain`, `onRepeat`.

**`<GeorgiaScreen>`** — pure props → JSX:
- `wordImage`, `wordText (only after reveal)`, `choices: TileChoice[]`, `gridShape: '6'|'12'|'18'`, `onPress`, `onRepeat`.
- No hooks; no i18n.

### D7. Precompute: `georgiaPreProcess`

```ts
type GeorgiaData = {
  corV: Tile[];                 // C and V tiles only
  similarPrefix: Map<string, string[]>; // tile/syllable → list of pool entries sharing first chars
};
```

Hard-band similar-prefix lookups are computed once at boot.

## Testing strategy

| Area | Approach |
|---|---|
| `countForLevel` | Jest unit |
| `correctFor(level, parsed)` (incl. PC→preceding LV rule) | Jest unit |
| `buildChoices` per CL band | Jest unit — verify N choices, correct present, no dupes |
| Word filter (starts-with-CorV) | Jest unit |
| `GeorgiaContainer` | Manual QA across CL1, CL4, CL7, CL10, S-CL1, S-CL4 |
| `GeorgiaScreen` | Storybook stories: 6/12/18 grid sizes, won state |
