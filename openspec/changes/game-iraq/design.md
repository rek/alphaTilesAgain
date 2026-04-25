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

| Java symbol (Iraq.java line) | TS destination | Notes |
|---|---|---|
| `cumulativeStageBasedTileList` (line 116) | `tilesAll: Tile[]` from `useLangAssets()` | Filter `SAD` + `SILENT_PLACEHOLDER_CONSONANTS` (lines 117-119) |
| `Collections.sort(allTiles, Comparator.comparing(t -> t.text))` (line 123) | `tilesSorted` (precompute) | Alpha by `tile.text` |
| `MULTITYPE_TILES` dedup when `!differentiatesTileTypes` (lines 151-162) | post-sort dedup | Skip duplicates by `tile.text` |
| `tilesPerPage = 35` (line 37) | `PAGE_SIZE = 35` | 5 rows × 7 cols |
| `numPages = (totalTiles - 1) / tilesPerPage` (line 126) | `numPages = Math.floor((n - 1) / 35)` | 0-based last page index |
| `currentPageNumber` (line 39) | `page: number` state | |
| `scanSetting = settingsList.find("Game 001 Scan Setting")` (line 82) | settings read | `1` / `2` / `3` |
| `tile.iconicWord` non-null/non-empty/`!= "-"` (line 293) | optional override at CL2 | |
| `gameSounds.play(tileAudioId, ...)` (line 287) | `playTileClip(tile)` via `useAudio()` | |
| `handler.postDelayed(..., tileAudioDuration + 500)` (line 440) | timeout after audio promise resolves | |
| `handler.postDelayed(restore, 2000)` (line 438) | `setTimeout(restore, 2000)` | Cleanup on unmount / page change / re-tap |
| `isAnimating` guard (lines 238-241) | `isAnimating: boolean` ref | Suppress re-taps |
| `setRotationY(180)` for RTL (lines 90-98) | RN `transform: [{ scaleX: -1 }]` on arrow images | Native flip |

### D2. Tile Filter

Exclude tiles where (matches `Iraq.java:117-119`):
- `SAD.contains(tile)`, OR
- `SILENT_PLACEHOLDER_CONSONANTS.contains(tile)`.

Then sort alphabetically by `tile.text` (line 123). Then, when `differentiatesTileTypes === false`, drop later tiles whose `text` already appeared (lines 151-162).

### D3. Word Lookup by `scanSetting`

Matches `Iraq.java:346-376`:

- `case 1` / `default` (lines 368-375): only position 1; if zero matches, skip (no word displayed).
- `case 2` (lines 347-358): position 1 first, fall back to position 2 if zero matches at position 1.
- `case 3` (lines 360-366): only position 3; if zero matches, skip.

```ts
function findWordForTile(tile: Tile, words: Word[], scan: 1|2|3, level: number): Word | null {
  // CL2 iconic-word override (Iraq.java:293)
  if (level === 2 && tile.iconicWord && tile.iconicWord !== '-') {
    return wordByText(words, tile.iconicWord) ?? null;
  }
  if (scan === 3) {
    const matches = words.filter(w => parsedTilesOf(w)[2]?.text === tile.text);
    return matches.length ? randomChoice(matches) : null;
  }
  // scan === 1 or 2: try position 1
  let matches = words.filter(w => parsedTilesOf(w)[0]?.text === tile.text);
  if (matches.length === 0 && scan === 2) {
    matches = words.filter(w => parsedTilesOf(w)[1]?.text === tile.text);
  }
  return matches.length ? randomChoice(matches) : null;
}
```

When `findWordForTile` returns `null`, the tile MUST still play its audio and revert; no word/image overlay is shown (matches the `skipThisTile` branch on Java lines 416-421).

### D4. Overlay Lifecycle

Matches `Iraq.java:236-446`. Pressing a tile transitions that tile's view:

1. Set `isAnimating = true` and disable all game buttons + options row + page arrows (lines 241-243).
2. Play tile audio via `playTileClip` (line 287).
3. After `tileAudioDuration + 500 ms` (line 440), set the tile to white background and overlay the chosen word's text + image (`ImageView` from `wordInLWC` drawable, lines 308-318 / 388-398). Word text passed through `stripInstructionCharacters` (line 303 / 381).
4. After 2000 ms (line 438), remove the image and restore original text + color, re-enable buttons (lines 426-438).
5. Re-taps during animation are ignored via `isAnimating` guard (lines 238-241).
6. Paginating cancels pending timers (RN-specific addition; Java cannot paginate during animation because arrows are unclickable).

### D5. Pagination

```ts
const PAGE_SIZE = 35;
const COLUMNS = 7;
const ROWS = 5;
// Java (line 126): numPages = (totalTiles - 1) / tilesPerPage  → 0-based last index
function lastPageIndex(n: number) { return Math.max(0, Math.floor((n - 1) / PAGE_SIZE)); }
function pageCount(n: number) { return lastPageIndex(n) + 1; }
```

Pagination arrows hidden at first/last page (`Iraq.java:220-234`):
- `previousSet`: `INVISIBLE` when `currentPageNumber === 0`.
- `nextSet`: `INVISIBLE` when `currentPageNumber === numPages`.

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
