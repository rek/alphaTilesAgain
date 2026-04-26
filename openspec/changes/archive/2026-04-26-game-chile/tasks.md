# Tasks: Game Chile (Phonemic Wordle)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/chile/spec.md`.
- [x] Read `Chile.java` and `TileAdapter.java` (Android source) to confirm color indices and evaluation logic.
- [x] Confirm `game-engine-base` is archived (upstream merged).

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-chile --directory=libs/alphaTiles/feature-game-chile --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-chile": ["libs/alphaTiles/feature-game-chile/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/chile.tsx`. Renders `<ChileContainer />`.

## 2. Precompute

- [x] Implement `src/chilePreProcess.ts`:
  - Read `minWordLength` (default 3), `maxWordLength` (default 100), `keyboardWidth` (default 7) from settings.
  - Filter `wordList`: parse each word into tiles, keep if tile count is within bounds.
  - Build keyboard: sorted union of all tile strings from valid words, max 50 tiles.
  - Return `ChileData { words, keys, keyboardWidth }`.
- [x] Register: `registerPrecompute('chile', chilePreProcess)` in `src/index.ts`.
- [x] Unit tests for `chilePreProcess`: verify word filtering, keyboard deduplication and sort order.

## 3. Guess Evaluation Logic

- [x] Implement `src/evaluateGuess.ts`: given `guess: string[]` and `secret: string[]`, return `ColorTile[]` with GREEN/BLUE/GRAY per D3.
- [x] Implement `src/updateKeyboard.ts`: given prior keyboard state and new guess results, advance each key's color (GRAY < BLUE < GREEN — never regress).
- [x] Unit tests for `evaluateGuess`: correct position, correct tile wrong position, duplicate tiles, all gray, all green.
- [x] Unit tests for `updateKeyboard`: color never regresses.

## 4. Presenter: `<ChileScreen>`

- [x] Define `ChileScreenProps`: `guessTiles: ColorTile[]`, `keyTiles: ColorTile[]`, `wordLength: number`, `keyboardWidth: number`, `onKeyPress: (tile: string) => void`, `onBackspace: () => void`, `onSubmitGuess: () => void`.
- [x] Implement `<ChileScreen>`:
  - Guess grid: `guessCount` rows × `wordLength` columns of colored tile cells.
  - Tile keyboard: `keyTiles` in a grid of `keyboardWidth` columns.
  - Backspace button and submit button.
- [x] Storybook stories: empty board, mid-game (mixed colors), won state, lost state (answer revealed).

## 5. Container: `<ChileContainer>`

- [x] Implement `<ChileContainer>`:
  - `usePrecompute('chile')`, `useGameShell()`, `useLangAssets()`.
  - State: `secret`, `guessTiles`, `keyTiles`, `currentRow`, `finished`.
  - Compute `guessCount = 8 - challengeLevel + 1` (or `baseGuessCount` from settings if overridden).
  - `onKeyPress(tile)`: fill next empty cell in current row.
  - `onBackspace()`: clear last filled cell in current row.
  - `onSubmitGuess()`: call `evaluateGuess`, update `guessTiles` and `keyTiles`, check win/lose.
  - Win: `updatePointsAndTrackers(1)`, show reset.
  - Lose (last row, no win): append correct answer row in GREEN.
  - `onReset()`: pick new secret from remaining wordList, reset state.
- [x] Wrap with `<GameShellContainer>`.

## 6. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-chile/tsconfig.lib.json`.
- [x] Lint: `nx lint alphaTiles-feature-game-chile`.
- [x] Test: `nx test alphaTiles-feature-game-chile`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles` — verify GREEN/BLUE/GRAY feedback, keyboard color update, win/lose states, RTL layout.
