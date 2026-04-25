# Tasks: Game Myanmar (Word Search)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/myanmar/spec.md`.
- [ ] Read `Myanmar.java`. Key callouts:
  - `directions[]` literal — preserve idx-4 bug (keypad-9 with dx=1,dy=0; effectively a duplicate of idx-1 right).
  - `maxDirections` switch (CL1=1, CL2=4, CL3=7); `wordD = rand.nextInt((maxDirections - min) + 1) + min` is INCLUSIVE upper bound.
  - Boundary checks branch on `wordDirection` (the keypad code), not on dx/dy — so idx 4's "code 9" still triggers north + east boundary checks even though it moves due-east.
  - Non-vowel filler: only `typeOfThisTileInstance.equals("V")` is excluded.
  - Method 2 (`respondToTileSelection2`) requires adjacency AND same-direction continuity from the 3rd tap onward.
- [ ] Confirm `game-engine-base` is archived (`openspec/changes/archive/2026-04-24-game-engine-base/`).

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-myanmar --directory=libs/alphaTiles/feature-game-myanmar --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-myanmar": ["libs/alphaTiles/feature-game-myanmar/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/myanmar.tsx`. Renders `<MyanmarContainer />`.

## 2. Pure Logic

- [ ] `src/directions.ts`: export `DIRECTIONS` (8-entry literal) + `MAX_DIRECTIONS_BY_CL` per D3. Preserve idx-4 quirk.
- [ ] `src/rollDirection.ts`: pure roller that takes `level` + `rng` → `(dx, dy)`.
- [ ] `src/placeWords.ts`: 7×7 placement with retry-100 + non-vowel filler. Boundary checks must mirror Java's keypad-code-based logic (NOT dx/dy-based).
- [ ] `src/fillRandomNonVowels.ts`: only excludes type `"V"`.
- [ ] `src/spanBetween.ts`: classic-method span resolver, returns `number[]` cells or `null`.
- [ ] `src/matchPath.ts`: ordered-equality match of cell sequence against `placedWords[*].path`.
- [ ] `src/stackAppend.ts`: pure reducer for Method 2 — `(stack, direction, tap, gridDims) => { stack, direction }`. Encapsulates pop/adjacency/continuity rules.
- [ ] Unit tests for each helper, including:
  - CL3 placement over 1000 seeded runs MUST never produce an up-right path (idx-4 bug regression test).
  - Method 2 continuity: ignored taps don't mutate stack; pop on re-tap last; stack cap = 8.

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
