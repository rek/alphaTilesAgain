## Context

Romania.java is a "Scanning" game. Unlike most AlphaTiles games, it doesn't test the user with multiple choices or puzzles. Instead, it guides the user through a sequence of words that feature a specific tile. This is often used as a teaching tool for new phonemes.

### Required reading for implementers

- `AGENTS.md`, `ARCHITECTURE.md`.
- `openspec/changes/game-engine-base/design.md`.
- `libs/alphaTiles/util-scoring/src/lib/noTrackerCountries.ts` (Romania is a NO_TRACKER_COUNTRY).

## Goals / Non-Goals

**Goals:**
- Port Romania scanning mechanic: sequence of words for a focus tile.
- Implement `scanSetting` logic (1=initial, 2=initial pref, 3=all).
- Support `boldInitialFocusTiles` setting for highlighting the tile in the word.
- Use `GameShellContainer` for the shared UI.

**Non-Goals:**
- Scoring or tracker increments (Romania skips these).

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `public class Romania extends GameActivity` | `RomaniaContainer.tsx` | |
| `int scanSetting` | `settings.scanSetting` | Read from `LangAssets.settings` |
| `boolean boldInitialFocusTiles` | `settings.boldInitialFocusTiles` | Read from `LangAssets.settings` |
| `Tile focusTile` | `focusTile` state | |
| `ArrayList<Word> wordsForTile` | `wordsForTile` state | |
| `int wordIndex` | `wordIndex` state | |
| `onBtnClick` | `onNextWord` handler | Tapping the word or an arrow moves to next |

### D2. `scanSetting` Logic

The words shown for a focus tile depend on `scanSetting`:
- `1`: `words.filter(w => parse(w)[0] === focusTile)`
- `2`: `[...words.filter(w => parse(w)[0] === focusTile), ...words.filter(w => parse(w)[0] !== focusTile && parse(w).includes(focusTile))]`
- `3`: `words.filter(w => parse(w).includes(focusTile))`

### D3. Precompute: `buildRomaniaData`

Romania needs words grouped by tiles.
```ts
export type RomaniaData = Record<string, Word[]>; // tileId -> words containing it
```
The precompute will iterate over all words, parse them into tiles, and build this mapping.

### D4. Bold Highlighting

If `boldInitialFocusTiles` is true, the `RomaniaScreen` will use a component that splits the word into tiles and renders the tiles matching `focusTile` with `fontWeight: 'bold'`.

### D5. Container / Presenter Split

**`<RomaniaContainer>`**
- Fetches `RomaniaData` from precompute.
- Manages `focusTile`, `wordsForTile`, and `wordIndex`.
- Handles navigation through words.
- Romania is a `NO_TRACKER_COUNTRY`, so it never calls `shell.incrementPointsAndTracker`.

**`<RomaniaScreen>`**
- Renders the `focusTile`.
- Renders the current `Word` (with optional bolding).
- Provides a "Next" button or handles tap on the word to advance.

## Unresolved Questions

- **Advancing Tiles**: When all words for a tile are seen, does it advance to the next tile? (In Java, it usually returns to Earth or moves to the next stage tile). We'll follow the `selectWordForStage` pattern but adapted for tiles.
