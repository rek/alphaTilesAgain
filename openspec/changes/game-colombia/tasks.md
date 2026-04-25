# Tasks: Game Colombia (Build the Word)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/colombia/spec.md`.
- [ ] Read `Colombia.java` to confirm CL keyboard layouts and pagination thresholds.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-colombia --directory=libs/alphaTiles/feature-game-colombia --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-colombia": ["libs/alphaTiles/feature-game-colombia/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/colombia.tsx`. Renders `<ColombiaContainer />`.

## 2. Pure Logic

- [ ] `src/evaluateAttempt.ts`: idle/building/wrong/overlong/win per D4.
- [ ] `src/buildKeyboard.ts`: per (variant, CL) per D2.
- [ ] `src/paginate.ts`: page slicing utility + page count.
- [ ] Unit tests covering each helper (incl. dedupe + type colouring for T-CL4).

## 3. Presenter: `<ColombiaScreen>`

- [ ] Define `ColombiaScreenProps`: `displayWord`, `attempt`, `attemptStatus`, `keys`, `page`, `pageCount`, `wordImage`, `onKey`, `onDelete`, `onPrev`, `onNext`, `onRepeat`.
- [ ] Implement `<ColombiaScreen>`:
  - Word image at top.
  - Active-word display (background colour from `attemptStatus`).
  - Keyboard grid sized to fit current page; delete button; pagination arrows visible only when `pageCount > 1`.
- [ ] Storybook stories: idle, building (yellow), wrong (orange), overlong (gray), won, paginated keyboard at page 0/1/last.

## 4. Container: `<ColombiaContainer>`

- [ ] Implement `<ColombiaContainer>`:
  - `usePrecompute('colombia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - On `syllableGame === 'S' && challengeLevel === 4` → `goBackToCountryMenu()` and bail.
  - State: `attempt`, `keys`, `page`, `status`, `refWord`.
  - On mount and on `onPlayAgain`: pick word, build keyboard via `buildKeyboard`, reset state, `playWord()`.
  - `onKeyPress(text)`: append text to `attempt`, recompute `status`, on `'win'` → `incrementPointsAndTracker(4)`, `playCorrectThenWord()`.
  - `onDelete()`: pop last entry from `attempt`, recompute `status`.
  - `onNextPage` / `onPrevPage`: bounded page increment/decrement.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-colombia/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-colombia`.
- [ ] Test: `nx test alphaTiles-feature-game-colombia`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify each of the 8 (CL,variant) configurations + S-CL4 escape.
