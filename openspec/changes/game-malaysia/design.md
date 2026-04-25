## Context

`Malaysia.java` is a non-scored word browser. 11 words/page (`wordStagesLists[stage - 1]`), each row showing text + image; tap to hear audio. Malaysia is in NO_TRACKER_COUNTRIES.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged) — note `NO_TRACKER_COUNTRIES`.
- **Source Java files:** `Malaysia.java`. `Start.java` for `wordStagesLists`, `colorList`.

## Goals / Non-Goals

**Goals:**
- 11-row pagination with text + image and pyramid colour cycle.
- Tap row → play word audio; re-enable after duration.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Tracker / points (NO_TRACKER).
- Syllable variant.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `wordStagesLists[stage-1]` | `pageWords: Word[][]` (precompute) | Pages of 11 |
| `currentPage` | `page: number` state | |
| `determineNumPages()` / `assignPages()` | `paginate(words, 11)` pure fn | At precompute time |
| `playWordAudio(view)` | `playWord(word)` via `useAudio()` | |
| Disable clicks while audio plays | `disabled: boolean` state | Re-enable after audio ends |
| Pagination arrows | `onPrev` / `onNext` handlers | |

### D2. Pyramid Colour Cycle

```ts
const COLOR_INDEX_PYRAMID = [0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]; // 11 entries
function rowColor(rowIndex: number, colorList: string[]): string {
  return colorList[COLOR_INDEX_PYRAMID[rowIndex]];
}
```

If a page has fewer than 11 rows, only the first N entries of `COLOR_INDEX_PYRAMID` are used.

### D3. Pagination

```ts
const PAGE_SIZE = 11;
function paginate<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}
```

### D4. Tap → Audio

```ts
async function onWordPress(word: Word) {
  if (disabled) return;
  setDisabled(true);
  await playWord(word); // resolves on audio end
  setDisabled(false);
}
```

Switching pages MUST cancel any pending audio (best-effort) and reset `disabled`.

### D5. NO_TRACKER Guard

Container MUST NOT call `incrementPointsAndTracker`. The screen has no win/lose state.

### D6. Container / Presenter Split

**`<MalaysiaContainer>`** — owns:
- `usePrecompute('malaysia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- State: `page`, `disabled`.
- Handlers: `onPrev`, `onNext`, `onWordPress`.

**`<MalaysiaScreen>`** — pure props → JSX:
- `rows: { word: Word; color: string; image: ImageSource }[]`, `page`, `pageCount`, `onPress(word)`, `onPrev`, `onNext`, `disabled`.
- No hooks; no i18n.

### D7. Precompute: `malaysiaPreProcess`

```ts
type MalaysiaData = { pages: Word[][] }; // stage-derived
```

Built once per stage. Re-derive on stage change via `useGameShell()`.

## Testing strategy

| Area | Approach |
|---|---|
| `paginate` (exact-multiple, partial last page) | Jest unit |
| `rowColor` (pyramid pattern) | Jest unit |
| `MalaysiaContainer` | Manual QA: paginate, tap multiple rows, confirm no points awarded |
| `MalaysiaScreen` | Storybook stories: page 1 (full 11 rows), last page partial |
