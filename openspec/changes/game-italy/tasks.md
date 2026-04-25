# Tasks: Game Italy (Lotería)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/italy/spec.md`.
- [ ] Read `Italy.java` to confirm setup order, win sequences, and deck-exhaustion path.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-italy --directory=libs/alphaTiles/feature-game-italy --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-italy": ["libs/alphaTiles/feature-game-italy/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/italy.tsx`. Renders `<ItalyContainer />`.

## 2. Pure Logic

- [ ] `src/winSequences.ts`: `WIN_SEQUENCES` constant (10 entries, indices 0..15).
- [ ] `src/checkWin.ts`: returns winning sequence or `null` for current `board.covered`.
- [ ] `src/setupRound.ts`: deck size + shuffle + 16-card board per D3.
- [ ] Unit tests for each helper, including all 10 winning patterns.

## 3. Presenter: `<ItalyScreen>`

- [ ] Define `ItalyScreenProps`: `board`, `currentCallText`, `currentCallImage`, `onTile`, `onAdvance`, `onRepeat`, `disabled`, `won`.
- [ ] Implement `<ItalyScreen>`:
  - 4×4 grid; each cell shows tile text + word/syllable image; bean overlay when `covered`; loteria-bean overlay when `loteria`.
  - Caller area at top with current call text + image.
  - Repeat button (re-plays current call); advance arrow.
- [ ] Storybook stories: empty board, mid-game (some beans), lotería row, lotería diagonal.

## 4. Container: `<ItalyContainer>`

- [ ] Implement `<ItalyContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - On mount and on `onPlayAgain`: read `Italy Deck Size` setting (default 54). If source list shorter than `deckSize` → `goBackToCountryMenu()`.
  - Build `board` and `deck` per `setupRound`.
  - State: `board`, `deck`, `deckIndex`, `won`, `wrongPicks`.
  - `onAdvance()`: if `deckIndex >= deckSize - 1` and not `won` → playIncorrect ×2, then `onPlayAgain()`. Else `deckIndex++`, `playWord()`.
  - `onTilePress(boardIndex)`: per D4 (correct → cover, win-check, points; wrong → playIncorrect).
  - `onRepeat()`: replay current call audio.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-italy/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-italy`.
- [ ] Test: `nx test alphaTiles-feature-game-italy`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify lotería on each pattern, deck exhaustion reset, T/S variants.
