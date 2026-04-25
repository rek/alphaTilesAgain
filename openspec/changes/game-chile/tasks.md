# Tasks: Game Chile (Phonemic Wordle)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/chile/spec.md`.
- [ ] Read `Chile.java` and `TileAdapter.java` (Android source) to confirm color indices and evaluation logic.
- [ ] Confirm `game-engine-base` is archived (upstream merged).

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-chile --directory=libs/alphaTiles/feature-game-chile --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-chile": ["libs/alphaTiles/feature-game-chile/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/chile.tsx`. Renders `<ChileContainer />`.

## 2. Precompute

- [ ] Implement `src/chilePreProcess.ts`:
  - Read `minWordLength` (default 3), `maxWordLength` (default 100), `keyboardWidth` (default 7) from settings.
  - Filter `wordList`: parse each word into tiles, keep if tile count is within bounds.
  - Build keyboard: sorted union of all tile strings from valid words, max 50 tiles.
  - Return `ChileData { words, keys, keyboardWidth }`.
- [ ] Register: `registerPrecompute('chile', chilePreProcess)` in `src/index.ts`.
- [ ] Unit tests for `chilePreProcess`: verify word filtering, keyboard deduplication and sort order.

## 3. Guess Evaluation Logic

- [ ] Implement `src/evaluateGuess.ts`: given `guess: string[]` and `secret: string[]`, return `ColorTile[]` with GREEN/BLUE/GRAY per D3.
- [ ] Implement `src/updateKeyboard.ts`: given prior keyboard state and new guess results, advance each key's color (GRAY < BLUE < GREEN — never regress).
- [ ] Unit tests for `evaluateGuess`: correct position, correct tile wrong position, duplicate tiles, all gray, all green.
- [ ] Unit tests for `updateKeyboard`: color never regresses.

## 4. Presenter: `<ChileScreen>`

- [ ] Define `ChileScreenProps`: `guessTiles: ColorTile[]`, `keyTiles: ColorTile[]`, `wordLength: number`, `keyboardWidth: number`, `onKeyPress: (tile: string) => void`, `onBackspace: () => void`, `onSubmitGuess: () => void`.
- [ ] Implement `<ChileScreen>`:
  - Guess grid: `guessCount` rows × `wordLength` columns of colored tile cells.
  - Tile keyboard: `keyTiles` in a grid of `keyboardWidth` columns.
  - Backspace button and submit button.
- [ ] Storybook stories: empty board, mid-game (mixed colors), won state, lost state (answer revealed).

## 5. Container: `<ChileContainer>`

- [ ] Implement `<ChileContainer>`:
  - `usePrecompute('chile')`, `useGameShell()`, `useLangAssets()`.
  - State: `secret`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
  - Compute `guessCount = 8 - challengeLevel + 1` (or `baseGuessCount` from settings if overridden).
  - `onKeyPress(tile)`: fill next empty cell in current row.
  - `onBackspace()`: clear last filled cell in current row.
  - `onSubmitGuess()`: call `evaluateGuess`, update `guessTiles` and `keyTiles`, check win/lose.
  - Win: `updatePointsAndTrackers(1)`, show reset.
  - Lose (last row, no win): append correct answer row in GREEN.
  - `onReset()`: pick new secret from remaining wordList, reset state.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-chile/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-chile`.
- [ ] Test: `nx test alphaTiles-feature-game-chile`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles` — verify GREEN/BLUE/GRAY feedback, keyboard color update, win/lose states, RTL layout.
