## Context

`Myanmar.java` is a 7×7 word-search. Words are pre-placed on the grid; user finds them by selecting cells. CL controls allowed directions; a settings key chooses one of two selection methods.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Myanmar.java`. `Start.java` for `wordList`, `tileList`, `colorList`, `settingsList`.

## Goals / Non-Goals

**Goals:**
- 7×7 grid placement of 7 words across 3 direction tiers.
- Two selection methods (classic + stack).
- Found-word colour cycling and image-bank.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Variable grid size or word count.
- Hint reveal beyond image-bank tap-to-show-text.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| 49 cell buttons | `cells: Cell[]` (length 49) | Index in row-major |
| `chosenWords` | `placedWords: PlacedWord[]` (length ≤ 7) | Each: `word`, `path: number[]`, `image` |
| `completionGoal` | `completionGoal: number` state | Decremented when a word can't be placed |
| `wordsCompleted` | `wordsCompleted: number` state | |
| `selectionMethod` | from settings: `Selection Method for Word Search` | `1` or `2` |
| `firstSelected`, `secondSelected` | classic-method state | |
| `selectedStack` | stack-method state (length ≤ 8) | |
| `clickPicHearAudio()` | image-bank tap handler | |
| `updatePointsAndTrackers(wordsCompleted)` | `incrementPointsAndTracker(wordsCompleted)` | On full completion |
| `clearImageFromImageBank` | mark image slot done after audio resolves | |

### D2. Grid Constants

```ts
const ROWS = 7;
const COLS = 7;
const CELLS = ROWS * COLS; // 49
const WORDS_PER_BOARD = 7;
const MIN_TILES = 3;
const MAX_TILES = 7;
const PLACEMENT_ATTEMPTS_PER_WORD = 100;
const STACK_LIMIT = 8;
```

### D3. Direction Tiers per Challenge Level

Mirror the Java `directions[]` array literally — including the idx-4 bug where keypad code `9` (up-right) carries `dx=1, dy=0` (right). Ports do not silently fix upstream bugs (see `docs/GAME_PATTERNS.md` "Java off-by-one quirks — preserve, don't fix").

```ts
// (dx, dy). dy>0 = down, dx<0 = left.
const DIRECTIONS: readonly [number, number][] = [
  [ 0,  1], // 0: right (keypad 2)
  [ 1,  0], // 1: down  (keypad 6)
  [-1,  1], // 2: down-left  (keypad 1)
  [ 1,  1], // 3: down-right (keypad 3)
  [ 1,  0], // 4: right — Java BUG: keypad 9 with dx=1,dy=0; duplicate of idx 1's movement
  [-1,  0], // 5: left  (keypad 4)
  [-1, -1], // 6: up-left (keypad 7)
  [ 0, -1], // 7: up    (keypad 8)
] as const;

const MAX_DIRECTIONS_BY_CL = { 1: 1, 2: 4, 3: 7 } as const;

function rollDirection(level: 1 | 2 | 3, rng: () => number): readonly [number, number] {
  const max = MAX_DIRECTIONS_BY_CL[level];
  const i = Math.floor(rng() * (max + 1)); // [0, max] inclusive
  return DIRECTIONS[i];
}
```

Resulting unique direction sets:
- **CL1**: `right`, `down` (2)
- **CL2**: `right`, `down`, `down-left`, `down-right` (4 — idx 4 dup of idx 1 ignored for set-uniqueness)
- **CL3**: above + `left`, `up-left`, `up` (7 — **`up-right` NEVER picked** due to idx-4 bug)

### D4. Placement Algorithm

```ts
function placeWords(words: Word[], level: 1|2|3, rng): { grid: (Tile|null)[]; placed: PlacedWord[] } {
  const grid: (Tile | null)[] = new Array(CELLS).fill(null);
  const placed: PlacedWord[] = [];
  for (const w of words.slice(0, WORDS_PER_BOARD * 2 /* buffer */)) {
    if (placed.length === WORDS_PER_BOARD) break;
    const tiles = parseTilesOf(w);
    if (tiles.length < MIN_TILES || tiles.length > MAX_TILES) continue;
    const path = tryPlace(grid, tiles, level, rng, PLACEMENT_ATTEMPTS_PER_WORD);
    if (path) { writePath(grid, tiles, path); placed.push({ word: w, path, color: null }); }
  }
  fillRandomNonVowels(grid, rng); // exclude only typeOfThisTileInstance === "V"
  return { grid, placed };
}
```

Words that cannot be placed within 100 attempts are skipped; `completionGoal = placed.length`.

**Non-vowel filler.** Mirror Java `Myanmar.java`: only tiles whose `typeOfThisTileInstance === "V"` are excluded. `LV`/`AV`/`BV`/`FV` are NOT excluded. Source tile pool is `tileListNoSAD` (= tile list minus space/auto/dummy types — already filtered upstream).

### D5. Selection Methods

**Method 1 (classic):**
- State: `first: number | null`, `second: number | null`.
- On cell tap:
  - If `first == null`: `first = i`.
  - Else: `second = i`. Compute span between them; if span matches a placed word path → mark found. Reset both regardless.

**Method 2 (stack) — directional continuity required (Java `respondToTileSelection2`):**
- State: `stack: number[]` (max length `STACK_LIMIT`), `direction: [number, number] | null`.
- Pop rule: if `i === last(stack)` → pop (un-select last cell); if stack now has < 2 cells, clear `direction`.
- Append rules:
  - **1st tap** (`stack.length === 0`): always append; `direction = null`.
  - **2nd tap** (`stack.length === 1`): MUST be 8-neighbour-adjacent to the 1st. Set `direction = (i.x - prev.x, i.y - prev.y)` normalized to ±1/0. Else ignore.
  - **3rd+ tap**: MUST be 8-neighbour-adjacent to last AND `(i.x - last.x, i.y - last.y) === direction`. Else ignore.
- After every append: check if `stack` (ordered) equals any `placedWord.path` → mark found and reset.
- On found or `stack.length === STACK_LIMIT` → reset stack + direction.

### D6. Found-Word Highlight

Cycle through `colorList` indices when a word is found:
```ts
const FOUND_COLOR_CYCLE = [...]; // indices used by Java for found-word highlighting
function nextFoundColor(idx: number): string { return colorList[FOUND_COLOR_CYCLE[idx % FOUND_COLOR_CYCLE.length]]; }
```

### D7. Completion

When `wordsCompleted === completionGoal`:
- Set advance arrow blue.
- `incrementPointsAndTracker(wordsCompleted)`.
- `playCorrectThenWord(true)` (celebration variant).
- Clear remaining image-bank slots.

### D8. Image Bank

7 image slots on the right of the grid. Tapping a slot plays the word's audio and shows its text in `activeWordTextView`. Slot is cleared after audio when the word has been found.

### D9. Container / Presenter Split

**`<MyanmarContainer>`** — owns:
- `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `grid`, `placedWords`, `completionGoal`, `wordsCompleted`, `selectionMethod`, classic + stack state, `activeWord`.
- Handlers: `onCellPress`, `onImagePress`, `onPlayAgain`, `onRepeat`.

**`<MyanmarScreen>`** — pure props → JSX:
- `grid: { text: string; color?: string }[]`, `imageBank: { image; played: boolean }[]`, `activeWord`, `selection: number[]`, `onCell`, `onImage`, `onRepeat`.
- No hooks; no i18n.

## Testing strategy

| Area | Approach |
|---|---|
| `placeWords` invariants (no overlap conflicts; respects allowed dirs; ≤7 placed) | Jest unit with seeded RNG |
| `dirsFor` (CL→dirs map) | Jest unit |
| Classic-method span match (incl. reverse spans for CL3) | Jest unit |
| Stack-method match (incl. ordering and length cap) | Jest unit |
| `MyanmarContainer` | Manual QA across CL1/2/3 and both selection methods |
| `MyanmarScreen` | Storybook stories: fresh board, mid-game with 3 found, completed |
