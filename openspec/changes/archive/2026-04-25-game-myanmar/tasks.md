# Tasks: Game Myanmar (Word Search)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/myanmar/spec.md`.
- [x] Read `Myanmar.java`. Key callouts:
  - `directions[]` literal — preserve idx-4 bug (keypad-9 with dx=1,dy=0; effectively a duplicate of idx-1 right).
  - `maxDirections` switch (CL1=1, CL2=4, CL3=7); `wordD = rand.nextInt((maxDirections - min) + 1) + min` is INCLUSIVE upper bound.
  - Boundary checks branch on `wordDirection` (the keypad code), not on dx/dy — so idx 4's "code 9" still triggers north + east boundary checks even though it moves due-east.
  - Non-vowel filler: only `typeOfThisTileInstance.equals("V")` is excluded.
  - Method 2 (`respondToTileSelection2`) requires adjacency AND same-direction continuity from the 3rd tap onward.
- [x] Confirm `game-engine-base` is archived (`openspec/changes/archive/2026-04-24-game-engine-base/`).

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-myanmar --directory=libs/alphaTiles/feature-game-myanmar --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-myanmar": ["libs/alphaTiles/feature-game-myanmar/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/myanmar.tsx`. Renders `<MyanmarContainer />`.

## 2. Pure Logic

- [x] `src/directions.ts`: export `DIRECTIONS` (8-entry literal) + `MAX_DIRECTIONS_BY_CL` per D3. Preserve idx-4 quirk.
- [x] `src/rollDirection.ts`: pure roller that takes `level` + `rng` → `(dx, dy)`.
- [x] `src/placeWords.ts`: 7×7 placement with retry-100 + non-vowel filler. Boundary checks must mirror Java's keypad-code-based logic (NOT dx/dy-based).
- [x] `src/fillRandomNonVowels.ts`: only excludes type `"V"`.
- [x] `src/spanBetween.ts`: classic-method span resolver, returns `number[]` cells or `null`.
- [x] `src/matchPath.ts`: ordered-equality match of cell sequence against `placedWords[*].path`.
- [x] `src/stackAppend.ts`: pure reducer for Method 2 — `(stack, direction, tap, gridDims) => { stack, direction }`. Encapsulates pop/adjacency/continuity rules.
- [x] Unit tests for each helper, including:
  - CL3 placement over 200 seeded runs MUST never produce an up-right path (idx-4 bug regression test).
  - Method 2 continuity: ignored taps don't mutate stack; pop on re-tap last; stack cap = 8.

## 3. Presenter: `<MyanmarScreen>`

- [x] Define `MyanmarScreenProps`: `grid` (49 cells with optional colour + selected flag), `imageBank` (7 entries with `done`), `activeWord`, `onCellPress`, `onImagePress`, `interactionLocked`.
- [x] Implement `<MyanmarScreen>`:
  - 7×7 grid with proportional text size.
  - Image bank column on the right.
  - Active-word text area below grid.
- [x] Storybook stories: Default, ClassicFirstTapped, StackBuilding, MidGame (3 found), Completed, InsufficientContent.

## 4. Container: `<MyanmarContainer>`

- [x] Implement `<MyanmarContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`.
  - On mount and on shell advance: choose 7+ candidate words, run `placeWords`, set `completionGoal`.
  - State: `grid`, `placedWords`, `selectionMethod` (from settings), classic + stack state, `foundFlags`, `foundColorBySlot`, `activeWord`.
  - `onCellPress(i)`: dispatch to classic or stack handler per D5; on found → set found colour, increment, possibly trigger completion.
  - `onImagePress(slot)`: play word audio, show its text.
  - On `wordsCompleted === completionGoal` → `incrementPointsAndTracker(true)`, chain `playCorrect → replayWord`.
- [x] Wrap with `<GameShellContainer>`.

## 5. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-myanmar/tsconfig.lib.json` — no new errors (one pre-existing data-language-assets error unrelated; tracked separately).
- [x] Lint: `./nx lint feature-game-myanmar` — clean.
- [x] Test: `./nx test feature-game-myanmar` — 33/33 passing.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1/2/3 placements + both selection methods. (Pending; cannot drive browser from automation.)
