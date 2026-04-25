## Context

`Italy.java` implements a Lotería board: 16 tiles in a 4×4 grid; a caller advances through a shuffled deck; player taps the matching tile; first row/column/diagonal of beans wins. Both tile (`T`) and syllable (`S`) variants are supported by source list selection.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`.
- `docs/ARCHITECTURE.md` §3, §11, §13.
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged).
- **Source Java files:** `Italy.java`. `Start.java` for `wordList`, `syllableList`, `settingsList`.

## Goals / Non-Goals

**Goals:**
- 4×4 board with 10 winning sequences (rows, columns, diagonals).
- Deck advancement via "next" arrow; deck exhaustion path.
- Correct/wrong audio + bean placement; lotería celebration.
- T and S variants (source list switch).
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Multiple parallel boards.
- Hint / show-correct-on-board features.

## Decisions

### D1. Java surface → TS artifact mapping

| Java symbol | TS destination | Notes |
|---|---|---|
| `gameCards` | `deck: Word[]` (or `Syllable[]` in S) | Shuffled `deckSize` slice of source list |
| `boardCards` | `board: BoardCell[]` (16 entries) | First 16 of pre-shuffle `gameCards` |
| `deckIndex` | `deckIndex: number` state | Caller pointer |
| `beans` | `boardCells[i].covered: boolean` | Bean overlay |
| `boardCells[i].loteria: boolean` | Set on winning sequence | |
| `LOTERIA_SEQUENCES` | `WIN_SEQUENCES: number[][]` const (10 entries) | |
| `nextWordFromGameSet()` | `onAdvance()` handler | |
| `respondToTileSelection()` | `onTilePress(boardIndex)` handler | |
| `respondToLoteria()` | inline path on win in `onTilePress` | |
| `playCorrectSoundThenActiveWordClip(false)` | `playCorrectThenWord(false)` | |
| `playCorrectSoundThenActiveWordClip(true)` | `playCorrectThenWord(true)` | Loteria celebration |
| `playIncorrectSound()` | `playIncorrect()` | |
| `updatePointsAndTrackers(4)` | `incrementPointsAndTracker(4)` | On lotería only |
| `goBackToEarth()` | `useGameShell().goBackToCountryMenu()` | When too few words |

### D2. Win Sequences

```ts
// Indices 0..15 in row-major order on a 4x4 board.
const WIN_SEQUENCES: number[][] = [
  [0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15],   // rows
  [0,4,8,12], [1,5,9,13], [2,6,10,14], [3,7,11,15],   // cols
  [0,5,10,15], [3,6,9,12],                             // diagonals
];
```

### D3. Setup Algorithm

```ts
const deckSize = settings.italyDeckSize ?? 54;
const source = syllableGame === 'S' ? syllableList : wordList;
if (source.length < deckSize) goBackToCountryMenu();
const initialShuffle = shuffle(source).slice(0, deckSize); // gameCards
const board = initialShuffle.slice(0, 16).map(toBoardCell); // 4x4
const deck = shuffle(initialShuffle); // re-shuffle for caller
```

`board` keeps its order for the duration of the round. `deck` advances via `deckIndex`.

### D4. Tap Resolution

```ts
function onTilePress(boardIndex: number) {
  const matched = board[boardIndex].text === currentRefWord.text;
  if (!matched) { playIncorrect(); return; }
  board[boardIndex].covered = true;
  const winSeq = WIN_SEQUENCES.find(seq => seq.every(i => board[i].covered));
  if (winSeq) {
    winSeq.forEach(i => board[i].loteria = true);
    setAdvanceArrowToBlue();
    playCorrectThenWord(true);
    incrementPointsAndTracker(4);
  } else {
    playCorrectThenWord(false);
    onAdvance(); // auto-advance after non-winning correct tap
  }
}
```

### D5. Deck Exhaustion

When `deckIndex === deckSize - 1` (or `>= deck.length`) and lotería not yet achieved:
- Play incorrect sound twice.
- Call `playAgain()` (re-setup): re-shuffle, rebuild board, reset beans, reset deckIndex.

### D6. Variant T vs S

Tile text and audio source switch by `syllableGame`:
- T: each `BoardCell.text = word.wordInLOP`, audio via word clip.
- S: each `BoardCell.text = syllable.text`, audio via syllable clip.

Image: variant-2 image (`<wordInLWC>2.png`) for T; for S, use the syllable's image if available else no image (per Java).

### D7. Container / Presenter Split

**`<ItalyContainer>`** — owns:
- `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
- State: `board`, `deck`, `deckIndex`, `won`, `wrongPicks`.
- Handlers: `onTilePress`, `onAdvance`, `onRepeat`, `onPlayAgain`.

**`<ItalyScreen>`** — pure props → JSX:
- `board: BoardCell[]`, `currentCallText: string`, `won: boolean`, `onTile`, `onAdvance`, `onRepeat`.
- No hooks; no i18n.

## Testing strategy

| Area | Approach |
|---|---|
| Win-sequence detection (each of 10 sequences) | Jest unit |
| Setup invariants (board.length=16, deck.length=deckSize) | Jest unit with seeded RNG |
| Variant switch (T vs S source) | Jest unit |
| `ItalyContainer` | Manual QA: full round, win on each kind of sequence, deck-exhaustion reset |
| `ItalyScreen` | Storybook stories: empty board, mid-game with beans, lotería on row / col / diagonal |
