## Context

`Sudan.java` is a non-scored audio browser. Tiles (or syllables) are paginated; tapping plays audio. Sudan is in NO_TRACKER_COUNTRIES — `shouldIncrementTracker(country)` returns `false`.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged) — note `NO_TRACKER_COUNTRIES`.
- **Source Java files:** `Sudan.java`. `Start.java` for tile/syllable lists, color lookups.

## Goals / Non-Goals

**Goals:**
- Two variants: tiles (63/page, type-coloured) and syllables (35/page, syllable-coloured).
- Tap → audio with disable-during-playback.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Tracker / points (NO_TRACKER).
- Word overlays (Iraq's mechanic).

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `cumulativeStageBasedTileList` minus SAD/SILENT | `tilesAll` (precompute) | Tile variant |
| `syllableList` | `syllablesAll` (precompute) | Syllable variant |
| type colour lookup | per D2 | |
| `currentPage` | `page: number` state | |
| `playTileAudio` / `playSyllableAudio` | `playTileClip` / `playSyllableClip` via `useAudio()` | |
| `hasSyllableAudio` | per-syllable boolean from langInfo | Disable tap when false |

### D2. Page Size and Colour

```ts
const TILE_PAGE_SIZE = 63;
const SYLLABLE_PAGE_SIZE = 35;

function tileColor(tile: Tile, colorList: string[]): string {
  switch (tile.typeOfThisTileInstance) {
    case 'C': return colorList[1];
    case 'V': case 'LV': case 'AV': case 'BV': case 'FV':
      return colorList[2];
    case 'T': return colorList[3];
    default:  return colorList[4];
  }
}

function syllableColor(syl: Syllable, colorList: string[]): string {
  return colorList[syl.colorIndex];
}
```

### D3. Tile Filter (Tile Variant)

Exclude tiles where `tile.text === 'SAD'` or tile is in `SILENT_PLACEHOLDER_CONSONANTS`.

### D4. Tap → Audio

```ts
async function onTilePress(tile: Tile) {
  if (disabled) return;
  setDisabled(true);
  await playTileClip(tile);
  setDisabled(false);
}
async function onSyllablePress(syl: Syllable) {
  if (disabled || !syl.hasSyllableAudio) return;
  setDisabled(true);
  await playSyllableClip(syl);
  setDisabled(false);
}
```

Switching pages MUST cancel pending audio (best-effort) and reset `disabled`.

### D5. NO_TRACKER Guard

Container MUST NOT call `incrementPointsAndTracker`. The screen has no win/lose state.

### D6. Container / Presenter Split

**`<SudanContainer>`** — owns:
- `usePrecompute('sudan')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `page`, `disabled`. Variant flag from `syllableGame`.
- Handlers: `onTilePress` / `onSyllablePress`, `onPrev`, `onNext`.

**`<SudanScreen>`** — pure props → JSX:
- Tile variant: `tilesOnPage: { text: string; color: string }[]`, `onTile(index)`.
- Syllable variant: `syllablesOnPage: { text: string; color: string; tappable: boolean }[]`, `onSyllable(index)`.
- `page`, `pageCount`, `disabled`, `onPrev`, `onNext`.
- No hooks; no i18n.

### D7. Precompute: `sudanPreProcess`

```ts
type SudanData = {
  tilePages: Tile[][];     // 63/page
  syllablePages: Syllable[][]; // 35/page
};
```

Pre-paginate at boot using current stage; rebuild on stage change.

## Testing strategy

| Area | Approach |
|---|---|
| Tile filter (SAD / silent placeholders excluded) | Jest unit |
| `tileColor` per type | Jest unit |
| `syllableColor` (uses syllable's own index) | Jest unit |
| Pagination (63-tiles/page, 35-syll/page) | Jest unit |
| Disabled-tap when `!hasSyllableAudio` | Jest unit (component-level) |
| `SudanContainer` | Manual QA: tile + syllable variants; confirm no points |
| `SudanScreen` | Storybook stories: tile page (63), syllable page, syllable page with no-audio entries |
