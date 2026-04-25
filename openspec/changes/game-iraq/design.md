## Context

`Iraq.java` is a non-scored reference screen. Tiles are listed alphabetically; tapping plays audio and shows a word containing the tile for 2 s. `scanSetting` controls which word position is searched. Iraq is in NO_TRACKER_COUNTRIES — `shouldIncrementTracker(country)` returns `false`, so the shell will not record points.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged) — note `NO_TRACKER_COUNTRIES`.
- **Source Java files:** `Iraq.java`. `Start.java` for `tileList`, `wordList`, `iconicWord`, `settingsList`.

## Goals / Non-Goals

**Goals:**
- Alphabetised pagination of all valid tiles (5×7, 35/page).
- Audio + 2 s word-context overlay per tile.
- `scanSetting`-aware word lookup, with iconic-word override at CL2.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Tracker / points (Iraq is in NO_TRACKER_COUNTRIES).
- Syllable variant.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `cumulativeStageBasedTileList` | `tilesAll: Tile[]` from `useLangAssets()` | Filter SAD + silent placeholders |
| `Collections.sort(tilesAll, byText)` | `tilesSorted` (precompute) | Alpha by `tile.text` |
| `currentPage` | `page: number` state | |
| `scanSetting` | from settings: `Game 001 Scan Setting` | `1`/`2`/`3` |
| `tile.iconicWord` | optional override at CL2 | |
| `playTileAudio()` | `playTileClip(tile)` via `useAudio()` | |
| `tileAudioDuration + 500ms` | timeout after audio promise resolves | |
| 2 s overlay timer | `setTimeout(restore, 2000)` | Cleanup on unmount/page change |

### D2. Tile Filter

Exclude tiles where:
- `tile.text === 'SAD'`, OR
- tile is in `SILENT_PLACEHOLDER_CONSONANTS`.

### D3. Word Lookup by `scanSetting`

```ts
function findWordForTile(tile: Tile, words: Word[], scan: 1|2|3, level: number): Word | null {
  if (level === 2 && tile.iconicWord) return wordByText(words, tile.iconicWord);
  const pos = scan;
  let matches = words.filter(w => parsedTilesOf(w)[pos - 1]?.text === tile.text);
  if (matches.length === 0 && scan === 2) {
    matches = words.filter(w => parsedTilesOf(w)[0]?.text === tile.text);
  }
  return matches.length ? randomChoice(matches) : null;
}
```

### D4. Overlay Lifecycle

Pressing a tile transitions that tile's view:
1. Play tile audio (`playTileClip`).
2. After audio completes (+ 500 ms), set `overlayTile = { tile, word }`.
3. After another 2000 ms, clear `overlayTile`.
4. Pressing another tile or paginating cancels pending timers and clears overlay.

### D5. Pagination

```ts
const PAGE_SIZE = 35;
const COLUMNS = 7;
const ROWS = 5;
function pageCount(n: number) { return Math.ceil(n / PAGE_SIZE); }
```

Pagination arrows hidden at first/last page.

### D6. NO_TRACKER Guard

Container MUST NOT call `incrementPointsAndTracker`. Shell-level guard in `GameShellContainer` is the safety net; Iraq simply never triggers a points event.

### D7. Container / Presenter Split

**`<IraqContainer>`** — owns:
- `usePrecompute('iraq')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `page`, `overlayTileIndex`, `overlayWord`.
- Refs: timer handles for cleanup.
- Handlers: `onTilePress`, `onPrev`, `onNext`.

**`<IraqScreen>`** — pure props → JSX:
- `tilesOnPage: TileView[]`, `overlayTileIndex?: number`, `overlayWord?: Word`, `pageCount`, `page`, callbacks.
- No hooks; no i18n.

## Testing strategy

| Area | Approach |
|---|---|
| Tile filter (SAD / silent placeholders excluded) | Jest unit |
| Alphabetic sort (locale-stable) | Jest unit |
| `findWordForTile` per `scanSetting` + CL2 iconicWord | Jest unit |
| Pagination edge cases (1 page, exact-multiple, partial last page) | Jest unit |
| `IraqContainer` | Manual QA: tap multiple tiles, paginate, verify NO points awarded |
| `IraqScreen` | Storybook stories: page 1 / last page / overlay active |
