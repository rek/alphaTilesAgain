## Context

`Sudan.java` is a non-scored audio browser. Tiles (or syllables) are paginated; tapping plays audio. Sudan is in NO_TRACKER_COUNTRIES — `shouldIncrementTracker(country)` returns `false`. Java has no `updatePointsAndTrackers` calls anywhere.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged) — note `NO_TRACKER_COUNTRIES`.
- **Source Java files:** `Sudan.java`. `Start.java` for tile/syllable lists, color lookups, `hasSyllableAudio` (global).

## Goals / Non-Goals

**Goals:**
- Two variants: tiles (63/page, type-coloured) and syllables (35/page, syllable-coloured).
- Tap → audio with disable-during-playback (whole grid + options row).
- Container/Presenter split; i18n-blind presenter.
- Match Java sequencing: precompute pages at mount, re-page on stage change.

**Non-Goals:**
- Tracker / points (NO_TRACKER) — Java has zero `updatePointsAndTrackers` calls.
- Word overlays (Iraq's mechanic).
- Cancelling pending audio when paging (Java does NOT cancel; the global `repeatLocked`/disable just naturally clears on the next `postDelayed` runnable).

## Decisions

### D1. Java surface → TS artifact mapping (Sudan.java)

| Java symbol (Sudan.java) | TS destination | Notes |
|---|---|---|
| `class Sudan extends GameActivity` | `<SudanContainer>` wrapping `<GameShellContainer>` | |
| `tilePagesLists`, `syllablePagesLists` | `tilePages`, `syllablePages` from precompute | |
| `currentPageNumber` | `page: number` state | Starts at 0 |
| `numPages` | `pageCount = pages.length` | Java's `numPages` is `pages - 1` (count of *additional* pages); we expose total count |
| `determineNumPages()` + `splitTileListAcrossPages()` | `sudanPreProcess()` (precompute) | Pure pagination, runs once at mount |
| `splitSyllablesListAcrossPages()` | same precompute | |
| `showCorrectNumTiles(page)` switch on `typeOfThisTileInstance` | `tileColor(tile, colorList)` (D2) | Java switch is exact: `C`/`V`/`T`/default — does NOT match `LV`/`AV`/`BV`/`FV` |
| `showCorrectNumSyllables(page)` `colorList.get(Integer.parseInt(color))` | `syllableColor(syl, colorList)` (D2) | `syl.color` is a numeric string |
| `onBtnClick(view)` | `onTilePress(i)` / `onSyllablePress(i)` handler | |
| `setAllGameButtonsUnclickable() + setOptionsRowUnclickable()` then `postDelayed(..., duration)` | `disabled` flag set true → `await playClip()` → set false | Whole grid + options row disabled during playback |
| `hasSyllableAudio` (global from `Start`) | `assets.hasSyllableAudio: boolean` (langInfo) | NOT per-syllable |
| `clickPicHearAudio(view)` | not used (no word image in Sudan) | super-class hook is a no-op here |
| `nextPageArrow` / `prevPageArrow` | `onNext` / `onPrev` handlers | Bounds checked |
| `showOrHideScrollingArrows()` | derived `showPrev = page > 0`, `showNext = page < pageCount - 1` | |

### D2. Page Size and Colour

```ts
const TILE_PAGE_SIZE = 63;     // Sudan.java tilesPerPage
const SYLLABLE_PAGE_SIZE = 35; // Sudan.java syllablesPerPage

// Match Sudan.java showCorrectNumTiles switch EXACTLY.
// Java does NOT case-fold vowel sub-types (LV/AV/BV/FV) — they fall to default.
function tileColor(tile: Tile, colorList: string[]): string {
  switch (tile.typeOfThisTileInstance) {
    case 'C': return colorList[1];
    case 'V': return colorList[2];
    case 'T': return colorList[3];
    default:  return colorList[4]; // includes LV, AV, BV, FV, AD, D, PC, X, etc.
  }
}

// Match Sudan.java showCorrectNumSyllables: colorList.get(Integer.parseInt(syllable.color))
function syllableColor(syl: Syllable, colorList: string[]): string {
  return colorList[Number(syl.color)];
}
```

### D3. Tile Filter (Tile Variant)

Source list: `cumulativeStageBasedTileList`. Exclude tiles where `SAD.contains(tile)` OR `SILENT_PLACEHOLDER_CONSONANTS.contains(tile)`. Java line: `splitTileListAcrossPages` body.

### D4. Tap → Audio

```ts
async function onTilePress(index: number) {
  if (disabled) return;
  setDisabled(true);                                // mirrors setAllGameButtonsUnclickable
  await playTileClip(tilesOnPage[index]);           // gameSounds.play + postDelayed(duration)
  setDisabled(false);                               // re-enable grid + options row
}

async function onSyllablePress(index: number) {
  if (disabled) return;
  if (!assets.hasSyllableAudio) return;             // GLOBAL flag (Java sets clickable=false for whole page)
  setDisabled(true);
  await playSyllableClip(syllablesOnPage[index]);
  setDisabled(false);
}
```

Java keeps the disable timer running via `soundSequencer.postDelayed(..., duration)` — the runnable always re-enables. Switching pages does NOT cancel the pending re-enable in Java. We follow Java behaviour: pressing prev/next does not abort the playing clip; the `disabled` flag clears when the (still-resolving) `await` completes.

### D5. NO_TRACKER Guard

Container MUST NOT call `incrementPointsAndTracker`. Java has zero `updatePointsAndTrackers(...)` calls in `Sudan.java`. The screen has no win/lose state; no advance arrow blue/gray cycling.

### D6. Container / Presenter Split

**`<SudanContainer>`** — owns:
- `usePrecompute('sudan')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `page: number`, `disabled: boolean`. Variant flag from `syllableGame`.
- Handlers: `onTilePress` / `onSyllablePress`, `onPrev`, `onNext`.
- `useMountEffect`: nothing (precompute happens in selector); pages already built.

**`<SudanScreen>`** — pure props → JSX:
- Tile variant props: `tilesOnPage: { text: string; color: string }[]`.
- Syllable variant props: `syllablesOnPage: { text: string; color: string; tappable: boolean }[]` (where `tappable = hasSyllableAudio` — same value for every syllable on the page).
- `page`, `pageCount`, `disabled`, `onPrev`, `onNext`, `onTile(i)`, `onSyllable(i)`.
- No hooks beyond `useWindowDimensions`; no `react-i18next`.

### D7. Precompute: `sudanPreProcess`

```ts
type SudanData = {
  tilePages: Tile[][];        // ceil(filteredTileCount / 63) pages
  syllablePages: Syllable[][];// ceil(syllableCount / 35) pages
};
```

Pre-paginate at boot using current stage; rebuild on stage change. Java does this in `onCreate` via `determineNumPages` + `splitTileListAcrossPages` / `splitSyllablesListAcrossPages`.

### D8. RTL handling

Java rotates instructions/prev/next icons 180° on RTL. We rely on RN logical layout + the engine's existing direction handling; no manual rotation needed in `<SudanScreen>`.

## Unresolved Questions

1. Java's tile-color switch ignores vowel sub-types (`LV`/`AV`/`BV`/`FV` → default colour). Bug or intended? Per "match Java" directive we replicate exactly.
2. Java's `hasSyllableAudio` is a global flag — every syllable on a page is either tappable or not. We mirror this; per-syllable audio gating is out of scope.

## Testing strategy

| Area | Approach |
|---|---|
| Tile filter (SAD / silent placeholders excluded) | Jest unit |
| `tileColor` per type — verify `LV`/`AV`/`BV`/`FV` map to default | Jest unit |
| `syllableColor` (uses syllable's own numeric-string `color`) | Jest unit |
| Pagination (63-tiles/page, 35-syll/page) | Jest unit on `sudanPreProcess` |
| Disabled-tap when `!hasSyllableAudio` (whole page) | Jest unit (component-level) |
| No `incrementPointsAndTracker` calls | Jest spy assertion |
| `<SudanContainer>` | Manual QA: tile + syllable variants; confirm no points |
| `<SudanScreen>` | Storybook: tile page (63), syllable page, syllable page with `hasSyllableAudio=false` |
