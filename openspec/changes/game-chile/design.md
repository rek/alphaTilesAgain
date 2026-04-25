## Context

Chile.java is a phonemic Wordle clone. The player guesses a secret word composed of language-pack tiles. Unlike standard Wordle (single-character letters), tiles may be multi-character phonemic units. The keyboard is built from the tiles present in the valid word list.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Chile.java` — full mechanic. `TileAdapter.java` — grid adapter for guess/keyboard views.

## Goals / Non-Goals

**Goals:**
- Port Chile Wordle mechanic: tile keyboard, guess rows, green/blue/gray feedback.
- Implement `chilePreProcess` precompute: build keyboard and filter word list by tile length.
- `challengeLevel` controls guess count: `guesses = baseGuessCount - challengeLevel + 1`.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Audio/image prompts — Chile is purely text-based.
- Hard-mode Wordle constraints.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `String[] secret` | `secret: string[]` state | Array of tile strings for the current word |
| `ArrayList<String[]> wordList` | precomputed, loaded via `usePrecompute('chile')` | Filtered, shuffled list |
| `ArrayList<ColorTile> tiles` | `guessTiles: ColorTile[]` state | Flat grid: rows × secret.length cells |
| `ArrayList<ColorTile> keys` | `keyTiles: ColorTile[]` state | Keyboard tiles |
| `int currentRow` | `currentRow: number` state | Which guess row is active |
| `boolean finished` | `finished: boolean` state | |
| `data.guesses` | `guessCount = baseGuessCount - challengeLevel + 1` | Rows available |
| `data.keyboardWidth` | `keyboardWidth` (from settings, default 7) | Keyboard column count |
| `keyPressed(view)` | `onKeyPress(tileText)` handler | Fills next empty cell in current row |
| `backSpace()` | `onBackspace()` handler | Clears last filled cell in current row |
| `completeWord()` | `onSubmitGuess()` handler | Scores current row |
| `reset()` | `onReset()` handler | Picks new secret, resets state |

### D2. Tile Color States

```ts
const GREEN = colorList[3];   // correct position
const BLUE  = colorList[1];   // correct tile, wrong position
const GRAY  = colorList[8];   // not in word
const EMPTY = colorList[6];   // unfilled cell
const KEY_COLOR = colorList[0]; // default keyboard tile
```

Color values read from `aa_colors.txt` at the same indices as Java (`Start.colorList`).

### D3. Guess Evaluation Logic

On submit (`completeWord`):
1. Compare current row tiles against `secret` position-by-position.
2. Exact matches → GREEN first pass.
3. Non-matches: scan `secret` for unmatched occurrences of the guessed tile → BLUE.
4. Remaining → GRAY.
5. Update keyboard: a key's color advances only to a higher certainty (GRAY < BLUE < GREEN).
6. Win: `greenCount === secret.length` → `updatePointsAndTrackers(1)`, show reset button.
7. Lose (row = last row, no win): show `secret` tiles in GREEN below the grid.

### D4. Precompute: `chilePreProcess`

Run at boot; stored under key `'chile'`:

```ts
type ChileData = {
  words: string[][];     // each word as array of tile strings
  keys: string[];        // sorted keyboard tiles
  keyboardWidth: number; // default 7, overridable by settings
  guesses: number;       // set per-game from challengeLevel
};
```

Building process:
1. Read `minWordLength` (default 3) and `maxWordLength` (default 100) from settings.
2. Filter `wordList`: parse each word into tiles, keep if `minLen ≤ tileCount ≤ maxLen`.
3. Build keyboard: union of all tile strings from valid words, max 50 tiles, sorted by `tileList` order.
4. `guesses` is not stored in precompute — computed per-game as `baseGuessCount - challengeLevel + 1`.

### D5. Container / Presenter Split

**`<ChileContainer>`** — owns:
- `usePrecompute('chile')`, `useGameShell()`.
- All state: `secret`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
- Handlers: `onKeyPress`, `onBackspace`, `onSubmitGuess`, `onReset`.
- Computes `guessCount = 8 - challengeLevel + 1` (or `baseGuessCount` if settings override).

**`<ChileScreen>`** — pure props → JSX:
- `guessTiles: ColorTile[]`, `keyTiles: ColorTile[]`, `wordLength: number`, `keyboardWidth: number`.
- Callbacks: `onKeyPress`, `onBackspace`, `onSubmitGuess`.
- No hooks — all data passed as props.

## Testing strategy

| Area | Approach |
|---|---|
| Guess evaluation (GREEN/BLUE/GRAY) | Jest unit tests — exhaustive edge cases |
| Keyboard color update logic | Jest unit tests |
| Precompute word filtering | Jest unit test with mock wordlist |
| `ChileContainer` | Manual QA against `engEnglish4` |
| `ChileScreen` | Storybook stories: empty board, mid-game, won, lost |
