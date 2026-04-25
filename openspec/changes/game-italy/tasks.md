# Tasks: Game Italy (Lotería)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/italy/spec.md`.
- [x] Read `Italy.java` to confirm setup order, win sequences, and deck-exhaustion path.
- [x] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-italy --directory=libs/alphaTiles/feature-game-italy --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-italy": ["libs/alphaTiles/feature-game-italy/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/italy.tsx`. Renders `<ItalyContainer />`.

## 2. Pure Logic

- [x] `src/winSequences.ts`: `WIN_SEQUENCES` constant (10 entries, indices 0..15).
- [x] `src/checkWin.ts`: returns winning sequence or `null` for current `board.covered`.
- [x] `src/setupRound.ts`: deck size + shuffle + 16-card board per D3.
- [x] Unit tests for each helper, including all 10 winning patterns.

## 3. Presenter: `<ItalyScreen>`

- [x] Define `ItalyScreenProps`: `board`, `currentCallText`, `currentCallImage`, `onTilePress`, `onCallerPress`, `disabled`, `won`, `callerLabel`, `beanImage`, `loteriaImage`.
- [x] Implement `<ItalyScreen>`:
  - 4×4 grid; each cell shows tile text + word/syllable image; bean overlay when `covered`; loteria-bean overlay when `loteria`.
  - Caller area at top with current call text + image.
  - Bean visuals are styled circles by default; consumers may inject image sources via `beanImage` / `loteriaImage`.
- [x] Storybook stories: empty board, mid-game (some beans), lotería row, lotería diagonal.

## 4. Container: `<ItalyContainer>`

- [x] Implement `<ItalyContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`.
  - On mount and on `startRound`: read `Italy Deck Size` setting (default 54). If source list shorter than `deckSize` → `router.replace('/earth')`.
  - Build `board` and `deck` per `setupRound`.
  - State: `board`, `deck`, `deckIndex`, `won`, `insufficient`.
  - `onAdvance()`: if `won` → reset; else if `deckIndex >= deck.length - 1` → playIncorrect ×2 + reset; else `deckIndex++` + play next call audio.
  - `onTilePress(boardIndex)`: per D4 — wrong → playIncorrect; correct → cover, win-check (loteria → +4 points + celebration audio; non-winning → chime + auto-advance after 800 ms).
  - `onRepeat()`: replay current call audio (uses `setOnRepeat` shell extension; required for S variant whose audio is a syllable clip, not a word clip).
- [x] Wrap with `<GameShellContainer>`.

## 5. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-italy/tsconfig.lib.json` (no Italy-specific errors; pre-existing infra warnings unchanged).
- [x] Lint: `nx lint feature-game-italy`.
- [x] Test: `nx test feature-game-italy` (3 suites / 14 tests pass).
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify lotería on each pattern, deck exhaustion reset, T/S variants. (Pending environment.)

## 6. Shell Extensions (additive, non-breaking)

- [x] `incrementPointsAndTracker(isCorrect, points?)` — default `points = 1`. Italy awards 4 per lotería.
- [x] `setOnRepeat(fn|null)` — mirror of `setOnAdvance`. Mechanic-registered repeat handler overrides the default `replayWord` (needed for S variant — repeat plays a syllable clip, not a word clip).
