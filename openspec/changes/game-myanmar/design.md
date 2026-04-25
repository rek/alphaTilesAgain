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

```ts
type Dir = 'right' | 'down' | 'down-right' | 'up-right' | 'left' | 'up' | 'up-left' | 'down-left';
const DIRS_CL1: Dir[] = ['right', 'down'];
const DIRS_CL2: Dir[] = [...DIRS_CL1, 'down-right', 'up-right'];
const DIRS_CL3: Dir[] = [...DIRS_CL2, 'left', 'up', 'up-left', 'down-left'];
function dirsFor(level: 1|2|3): Dir[] { return [DIRS_CL1, DIRS_CL2, DIRS_CL3][level-1]; }
```

### D4. Placement Algorithm

```ts
function placeWords(words: Word[], allowedDirs: Dir[], rng): { grid: string[]; placed: PlacedWord[] } {
  const grid = new Array(CELLS).fill(null);
  const placed: PlacedWord[] = [];
  for (const w of words.slice(0, WORDS_PER_BOARD * 2 /* buffer */)) {
    if (placed.length === WORDS_PER_BOARD) break;
    const tiles = parseTilesOf(w);
    if (tiles.length < MIN_TILES || tiles.length > MAX_TILES) continue;
    const path = tryPlace(grid, tiles, allowedDirs, rng, PLACEMENT_ATTEMPTS_PER_WORD);
    if (path) { writePath(grid, tiles, path); placed.push({ word: w, path, color: null }); }
  }
  fillRandomNonVowels(grid, rng);
  return { grid, placed };
}
```

Words that cannot be placed within 100 attempts are skipped; `completionGoal = placed.length`.

### D5. Selection Methods

**Method 1 (classic):**
- State: `first: number | null`, `second: number | null`.
- On cell tap:
  - If `first == null`: `first = i`.
  - Else: `second = i`. Compute span between them; if span matches a placed word path → mark found. Reset both regardless.

**Method 2 (stack):**
- State: `stack: number[]` (max length `STACK_LIMIT`).
- On cell tap: append `i` (or pop if `i === last`).
- After each append: check if the stack ordered cells equal any placed word path → mark found.
- On found or full stack (length 8) → reset stack (cleared after completion check).

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
