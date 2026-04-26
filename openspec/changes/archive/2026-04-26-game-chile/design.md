## Context

`Chile.java` (~384 LOC) is a phonemic Wordle clone. The player guesses a secret word composed of language-pack tiles. Unlike standard Wordle (single-character letters), tiles may be multi-character phonemic units. The keyboard is built from the tiles present in the valid word list (filtered + capped at 50 unique tiles in `chilePreProcess`).

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/GAME_PATTERNS.md` ("Java off-by-one quirks — preserve, don't fix").
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Chile.java` — full mechanic. `TileAdapter.java` — grid adapter for guess/keyboard views.

## Goals / Non-Goals

**Goals:**
- Port Chile Wordle mechanic: tile keyboard, guess rows, GREEN/BLUE/GRAY feedback exactly matching Java's two-pass scoring quirk (`Chile.java:205–221`).
- Implement `chilePreProcess` precompute: filter word list by tile-count, build a keyboard of up to 50 tiles, sort by `tileList` order (`Chile.java:302–369`).
- `challengeLevel` controls guess count: `data.guesses = baseGuessCount - challengeLevel + 1` (`Chile.java:91`).
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Audio/image prompts — Chile is purely text-based (no `wordImage`, no `playWord`).
- Hard-mode Wordle constraints.
- Animations.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol (Chile.java line) | TS destination | Notes |
|---|---|---|
| `class Chile extends GameActivity` | `<ChileContainer>` wrapping `<GameShellContainer>` | |
| `String[] secret` (35) | `secret: string[]` state | Array of tile strings for current word |
| `ArrayList<String[]> wordList` (40) | shuffled list in container state, refilled when exhausted | Java refills via `data.words` reshuffle (~170–179) |
| `ArrayList<ColorTile> tiles` (41) | `guessTiles: ColorTile[]` state | Flat grid: `data.guesses × secret.length` cells |
| `ArrayList<ColorTile> keys` (42) | `keyTiles: ColorTile[]` state | Keyboard tiles |
| `int currentRow` (33) | `currentRow: number` state | Active guess row |
| `boolean finished` (32) | `finished: boolean` state | |
| `data.guesses = baseGuessCount - challengeLevel + 1` (91) | `guessCount` derived in container | |
| `data.keyboardWidth` | `keyboardWidth` from precompute (default 7) | Grid columns |
| `keyPressed(view)` (286) | `onKeyPress(tileText)` handler | Fills next empty cell in current row, scrolls to row |
| `backSpace()` (150) | `onBackspace()` handler | Clears last filled cell in current row; no-op if `finished` |
| `completeWord()` (189) | `onSubmitGuess()` handler | Returns early if any cell empty; scores row |
| `reset()` (160) | `onReset()` handler | No-op if `!finished`; resets keys to `KEY_COLOR`, picks new secret, refills `wordList` if empty |
| `chilePreProcess()` (302) | `chilePreProcess()` pure fn | Built at boot |

### D2. Tile Color States (Java line 26–31)

```ts
const GREEN     = colorList[3];   // correct position
const BLUE      = colorList[1];   // correct tile, wrong position
const EMPTY     = colorList[6];   // unfilled cell background
const YELLOW    = colorList[5];   // text color on loss-reveal tiles only
const GRAY      = colorList[8];   // not in word
const KEY_COLOR = colorList[0];   // default keyboard tile background
```

Color values read from `aa_colors.txt` at the same indices as Java (`Start.colorList`).

### D3. Guess Evaluation Logic — match `Chile.java:189–284`

Java uses a **two-pass** algorithm with a `frontCor[]` "claim" flag and `correct[]` int array (0=gray, 1=green, 2=blue):

```ts
// Pass 1: mark exact matches GREEN. Each match also "claims" frontCor[i] = true.
for (let i = 0; i < row.length; i++) {
  if (row[i] === secret[i]) { frontCor[i] = true; correct[i] = 1; greenCount++; continue; }
  // Pass 2 (inline): scan row for an unmatched occurrence of secret[i].
  // Java quirk (Chile.java:213): the inner loop iterates over guessed-row positions x
  // looking for a tile in the GUESS that matches secret[i] but isn't itself green and
  // hasn't been claimed yet. Sets correct[x] = 2 (BLUE) on the GUESS position x — i.e.,
  // it marks BLUE at the guess slot whose text == secret[i], NOT at slot i.
  for (let x = 0; x < row.length; x++) {
    if (row[x] === secret[i] && row[x] !== secret[x] && !frontCor[i] && correct[x] === 0) {
      frontCor[i] = true; // claim that secret[i] has been accounted for
      correct[x] = 2;
      break;
    }
  }
}
// Apply colors from `correct[]`: 0→GRAY, 1→GREEN, 2→BLUE.
```

**Java parity note**: this two-pass behaviour preserves duplicate-tile semantics (only one BLUE per occurrence in `secret`). Do NOT rewrite as standard Wordle scoring — preserve the exact loop including the `frontCor[i]` flag indexed by `i` (the secret-index) while writing to `correct[x]` (the guess-index).

### D4. Keyboard Color Promotion — match `Chile.java:250–258`

After scoring a row, walk every guessed-tile/key pair. Update key color iff promotion:
- key starts at `KEY_COLOR` → may become GRAY/BLUE/GREEN.
- key at GRAY → may become BLUE/GREEN.
- key at BLUE → only becomes GREEN.
- key at GREEN → never changes.

Java condition (line 253): `(key.color != BLUE && key.color != GREEN) || (key.color == BLUE && row[i].color == GREEN)`.

### D5. Win / Lose / Continue — match `Chile.java:261–283`

- **Win** when `greenCount === secret.length` (and `!finished`):
  - `finished = true`.
  - Play correct sound (`Start.gameSounds.play(correctSoundID, …)`).
  - `updatePointsAndTrackers(1)` — i.e., `shell.incrementPointsAndTracker(true)` per ADR-010.
- **Lose** when `currentRow === data.guesses - 1` and not won:
  - `finished = true`.
  - Append `secret.length` extra `ColorTile`s (text=tile, bg=GREEN, **textColor=YELLOW**) to `tiles` and scroll to bottom (Java line 269 uses 3-arg `ColorTile` ctor with explicit text colour).
  - Play incorrect sound. **No** `updatePointsAndTrackers` call.
- **Continue** otherwise: `currentRow++`.
- When `finished` flips true (either branch):
  - Show repeat (reset) button, hide complete-word button.
  - `setAdvanceArrowToBlue()` → shell unlocks advance.
  - `setOptionsRowClickable()` (Java line 282) → shell unlocks the bottom row.

### D6. Reset Flow — match `Chile.java:160–187`

- Guard: if `!finished`, no-op.
- Scroll guess box to top.
- Set advance arrow to gray (re-lock).
- Reset every key's color to `KEY_COLOR` (do NOT rebuild keys).
- `currentRow = 0`, `finished = false`.
- If `wordList` is empty, refill from `data.words` and Fisher-Yates shuffle (`Chile.java:170–179`).
- `secret = wordList.pop()` — Java `remove(wordList.size() - 1)`.
- Re-init `tiles` to `data.guesses × secret.length` empty cells.
- Restore complete-word button visibility, hide repeat button.

### D7. Initial Boot — match `Chile.java:76–136`

- `updatePointsAndTrackers(0)` (no-op increment to set initial display).
- `setAdvanceArrowToGray()`.
- Apply RTL flips to backspace + repeat icons (`scaleX = -1`) when `scriptDirection === 'RTL'`.
- Set `data.guesses` from `baseGuessCount - challengeLevel + 1`.
- Build `keys` array as `KEY_COLOR` tiles in keyboard-grid order (row-major over `data.keyboardWidth`).
- Initial Fisher-Yates shuffle of `wordList`; `secret = wordList.pop()`.
- Build `tiles` (empty cells) for `data.guesses × secret.length`.
- Hide instruction button if `audioInstructionsResID` is 0 or -1.

### D8. Backspace — match `Chile.java:150–159`

Iterate the **current row** from right-to-left; clear the last non-empty cell, break. No-op if `finished`.

### D9. Key Press — match `Chile.java:286–301`

- Smooth-scroll to start of current row.
- Read tile text from the tapped key.
- Iterate current row left-to-right; fill the first empty cell, break.

### D10. Precompute: `chilePreProcess` — match `Chile.java:302–369`

```ts
type ChileData = {
  words: string[][];     // each word as array of tile strings
  keys: string[];        // sorted keyboard tiles (index order in tileList)
  keyboardWidth: number; // settings "Chile keyboard width", default 7
  fontScale: number;     // Util.getMinFontSize over keys
};
```

Building process:
1. Read settings: `Chile keyboard width` (default 7), `Chile base guess count` (default 8), `Chile minimum word length` (default 3), `Chile maximum word length` (default 100). Each parse wrapped in try/catch — bad value falls back to default.
2. For every `Start.Word`, parse into tiles. Keep only words with `minWordLength ≤ size ≤ maxWordLength`.
3. Build keyboard set: walk the filtered word list in order; for each word, add each tile to the keyboard set if `set.size < maxKeyboardSize` (50). If a word would introduce a tile that won't fit, **remove that word from the list and continue** (Java mutates `splitWords` in-place at line 341).
4. Sort the keyboard tile array by each tile's index in `Start.tileList` (Java line 350–367 builds an index array, sorts it, then maps back to text).
5. `guesses` is NOT stored in precompute — derived per-game from `baseGuessCount - challengeLevel + 1`.

**Java parity note**: keyboard-build mutates `splitWords` while iterating — preserve the "skip-and-restart-at-same-index" loop pattern (`i` only advances when `canUseWord`).

### D11. Container / Presenter Split

**`<ChileContainer>`** — owns:
- `usePrecompute('chile')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
- All state: `secret`, `wordListRemaining`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
- Handlers: `onKeyPress(tileText)`, `onBackspace()`, `onSubmitGuess()`, `onReset()`.
- `useMountEffect`: shuffle word list, pick secret, init `tiles`, register `setOnAdvance(onReset)`.
- Computes `guessCount = baseGuessCount - challengeLevel + 1`.

**`<ChileScreen>`** — pure props → JSX:
- Props: `guessTiles`, `keyTiles`, `wordLength`, `keyboardWidth`, `revealTiles?`, `onKeyPress`, `onBackspace`, `onSubmitGuess`, `submitDisabled`, `showReset`, `onReset`.
- No hooks; no `react-i18next` import.

## Java parity notes

- Two-pass scoring uses `frontCor[i]` indexed by secret position but assigns BLUE at guess-position `x` — a subtle quirk; preserve.
- BLUE never demotes to GRAY; GREEN never demotes; key color never regresses.
- Loss reveal uses GREEN bg + YELLOW text on extra tiles appended after the grid (not in-grid).
- Complete-word handler is **hard-locked** when any current-row cell is empty (returns early without sound).
- Reset is hard-locked when `!finished` (no-op).
- `wordList` is consumed by `pop()` from end (last shuffled element first); refilled+reshuffled when empty.

## Unresolved Questions

None blocking.

## Testing strategy

| Area | Approach |
|---|---|
| Two-pass scoring (GREEN/BLUE/GRAY) including duplicate-tile cases | Jest unit, exhaustive |
| Keyboard color promotion rule | Jest unit |
| Win path scores `updatePointsAndTrackers(1)` | Jest unit |
| Lose path appends GREEN+YELLOW reveal tiles, no score | Jest unit |
| Backspace clears last filled cell in current row | Jest unit |
| Key press fills first empty cell in current row | Jest unit |
| Reset refills wordList when empty (Fisher-Yates) | Jest unit (seeded RNG) |
| `chilePreProcess` filtering + 50-tile cap + sort | Jest unit (mock wordlist) |
| `<ChileContainer>` round flow | Manual QA across CL1/2/3 |
| `<ChileScreen>` | Storybook: empty board, mid-game, won, lost (reveal row) |
