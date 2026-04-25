# Tasks: Game Myanmar (Word Search)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/myanmar/spec.md`.
- [ ] Read `Myanmar.java` to confirm direction tiers, placement attempts, and selection-method branches.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-myanmar --directory=libs/alphaTiles/feature-game-myanmar --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-myanmar": ["libs/alphaTiles/feature-game-myanmar/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/myanmar.tsx`. Renders `<MyanmarContainer />`.

## 2. Pure Logic

- [ ] `src/dirsFor.ts`: CL→direction list per D3.
- [ ] `src/placeWords.ts`: 7×7 placement with retry-100 + non-vowel filler.
- [ ] `src/spanBetween.ts`: classic-method span resolver, returns `number[]` cells or `null`.
- [ ] `src/matchPath.ts`: stack/classic match against `placedWords[*].path`.
- [ ] Unit tests for each helper.

## 3. Presenter: `<MyanmarScreen>`

- [ ] Define `MyanmarScreenProps`: `grid` (49 cells with optional colour), `selection` (cells highlighted), `imageBank` (7 entries with `done`), `activeWord`, `onCell`, `onImage`, `onRepeat`, `disabled`.
- [ ] Implement `<MyanmarScreen>`:
  - 7×7 grid with proportional text size.
  - Image bank column on the right.
  - Active-word text area below grid.
- [ ] Storybook stories: fresh board, mid-game (3 words found), completed.

## 4. Container: `<MyanmarContainer>`

- [ ] Implement `<MyanmarContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - On mount and on `onPlayAgain`: choose 7+ candidate words, run `placeWords`, set `completionGoal`.
  - State: `grid`, `placedWords`, `selectionMethod` (from settings), classic + stack state, `wordsCompleted`, `activeWord`.
  - `onCellPress(i)`: dispatch to classic or stack handler per D5; on found → set found colour, increment, possibly trigger completion.
  - `onImagePress(slot)`: play word audio, show its text; if found, mark slot cleared after audio.
  - On `wordsCompleted === completionGoal` → setAdvanceArrowToBlue, `incrementPointsAndTracker(wordsCompleted)`, `playCorrectThenWord(true)`.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-myanmar/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-myanmar`.
- [ ] Test: `nx test alphaTiles-feature-game-myanmar`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1/2/3 placements + both selection methods.
