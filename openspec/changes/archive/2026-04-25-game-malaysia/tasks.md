# Tasks: Game Malaysia (Word Browser)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/malaysia/spec.md`.
- [ ] Read `Malaysia.java` to confirm 11-per-page, pyramid colour pattern.
- [ ] Confirm `game-engine-base` is archived and that NO_TRACKER guard is in `GameShellContainer`.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-malaysia --directory=libs/alphaTiles/feature-game-malaysia --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-malaysia": ["libs/alphaTiles/feature-game-malaysia/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/malaysia.tsx`. Renders `<MalaysiaContainer />`.

## 2. Precompute

- [ ] Implement `src/malaysiaPreProcess.ts`:
  - Build `pages` from `wordStagesLists[stage - 1]` via `paginate(_, 11)`.
- [ ] Register: `registerPrecompute('malaysia', malaysiaPreProcess)` in `src/index.ts`.
- [ ] Unit tests for paginate.

## 3. Pure Logic

- [ ] `src/rowColor.ts`: returns `colorList[COLOR_INDEX_PYRAMID[rowIndex]]`.
- [ ] Unit tests for color cycle.

## 4. Presenter: `<MalaysiaScreen>`

- [ ] Define `MalaysiaScreenProps`: `rows`, `page`, `pageCount`, `onPress`, `onPrev`, `onNext`, `disabled`.
- [ ] Implement `<MalaysiaScreen>`:
  - Up to 11 word rows; each row shows word text (coloured per pyramid) + word image.
  - Prev/next arrows; hidden at first/last page.
- [ ] Storybook stories: page 1 full, last page partial.

## 5. Container: `<MalaysiaContainer>`

- [ ] Implement `<MalaysiaContainer>`:
  - `usePrecompute('malaysia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
  - State: `page`, `disabled`. Refs to in-flight audio promises (for cancellation on page change).
  - `onPress(word)`: gated by `disabled`; await `playWord(word)`; clear `disabled`.
  - `onPrev`/`onNext`: bounded; cancel pending audio + reset `disabled`.
  - MUST NOT call `incrementPointsAndTracker`.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-malaysia/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-malaysia`.
- [ ] Test: `nx test alphaTiles-feature-game-malaysia`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — paginate, tap rows, confirm no points recorded.
