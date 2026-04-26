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

| Java symbol (Malaysia.java line) | TS destination | Notes |
|---|---|---|
| `wordStagesLists.get(stage-1)` (line 71, 81, 86) | `pageWords: Word[][]` (precompute) | Pages of 11 |
| `wordsPerPage = GAME_BUTTONS.length` (line 33) | `PAGE_SIZE = 11` | |
| `determineNumPages()` (lines 69-78) | `numPages = pages.length - 1` | 0-based last index |
| `assignPages()` (lines 80-89) | `paginate(words, 11)` pure fn | Left-to-right fill |
| `currentPageNumber` (line 24) | `page: number` state | |
| `colorless` (line 25) | `colorless: boolean` from settings | When `true`, all rows use `colorList[8]` |
| `wordInLOPWithStandardizedSequenceOfCharacters(word)` (line 105) | `standardizeWordSequence(word)` from `@shared/util-phoneme` | Display text |
| `int color = i<5 ? i : i>5 ? 10-i : 7` (line 107) | `COLOR_INDEX_PYRAMID[i]` | Pyramid `[0,1,2,3,4,7,4,3,2,1,0]` |
| `gameSounds.play(audioId, 1, 1, 2, 0, 1)` (line 202) | `playWord(word)` via `useAudio()` | |
| `soundSequencer.postDelayed(re-enable, duration)` (lines 204-211) | Re-enable after audio ends | Match Java duration |
| `setAllGameButtonsUnclickable` + `setAllGameImagesClickable(false)` (lines 195-196) | `disabled: boolean` state | Both rows AND images locked |
| `clickPicHearAudio(view)` → `onWordClick(view)` (lines 214-216) | image press = same handler as text press | |
| `showOrHideScrollingArrows` (lines 187-192) | derive arrow visibility from page | |
| RTL constraint swap (lines 146-167) | RTL-aware logical layout | Arrow images flipped via transform |

### D2. Pyramid Colour Cycle

Matches `Malaysia.java:107-108`:

```java
int color = i<5 ? i : i>5 ? 10-i : 7;
int wordColor = Color.parseColor(colorList.get(colorless ? 8 : color));
```

```ts
const COLOR_INDEX_PYRAMID = [0, 1, 2, 3, 4, 7, 4, 3, 2, 1, 0]; // 11 entries
function rowColorIndex(rowIndex: number, colorless: boolean): number {
  if (colorless) return 8;
  return COLOR_INDEX_PYRAMID[rowIndex];
}
function rowColor(rowIndex: number, colorList: string[], colorless: boolean): string {
  return colorList[rowColorIndex(rowIndex, colorless)];
}
```

If a page has fewer than 11 rows, only the first N entries of `COLOR_INDEX_PYRAMID` are used (Java loops only over `visibleGameButtons`, line 103).

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

Matches `Malaysia.java:194-212`:

```ts
async function onWordPress(word: Word) {
  if (disabled) return;
  setDisabled(true);                      // setAllGameButtonsUnclickable + setAllGameImagesClickable(false)
  await playWord(word);                   // gameSounds.play(audioId, 1,1,2,0,1)
  // Java: re-enable only when repeatLocked === true. RN equivalent: always re-enable on audio end.
  setDisabled(false);
}
```

Image tap delegates to the same handler (`clickPicHearAudio` → `onWordClick`, lines 214-216).

Switching pages MUST cancel any pending audio re-enable timer and reset `disabled`.

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

### D8. RTL Layout

Matches `Malaysia.java:146-167`. When `scriptDirection === "RTL"`:
- Forward and backward arrow images SHALL be mirrored (RN: `transform: [{ scaleX: -1 }]`).
- Layout SHALL place backward arrow on the right of the home button and forward arrow on the right of the instructions button (Java swaps `START`/`END` constraints).

In RN, prefer logical props (`marginStart`/`marginEnd`, `flexDirection: 'row'` with RTL auto-flip) so explicit constraint swap is unnecessary; only the arrow image flip is needed.

## Testing strategy

| Area | Approach |
|---|---|
| `paginate` (exact-multiple, partial last page) | Jest unit |
| `rowColor` (pyramid pattern) | Jest unit |
| `MalaysiaContainer` | Manual QA: paginate, tap multiple rows, confirm no points awarded |
| `MalaysiaScreen` | Storybook stories: page 1 (full 11 rows), last page partial |
