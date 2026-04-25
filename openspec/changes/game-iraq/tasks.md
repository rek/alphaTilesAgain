# Tasks: Game Iraq (Tile Explorer)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/iraq/spec.md`.
- [ ] Read `Iraq.java` to confirm tile filter, scan-setting branches, iconicWord rule.
- [ ] Confirm `game-engine-base` is archived and that NO_TRACKER guard is in `GameShellContainer`.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-iraq --directory=libs/alphaTiles/feature-game-iraq --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-iraq": ["libs/alphaTiles/feature-game-iraq/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/iraq.tsx`. Renders `<IraqContainer />`.

## 2. Precompute

- [ ] Implement `src/iraqPreProcess.ts`:
  - Filter tile list: drop SAD and silent placeholder consonants.
  - Sort alphabetically by `tile.text`.
  - Pre-index words by tile-position (positions 1, 2, 3) to avoid re-scanning at tap time.
- [ ] Register: `registerPrecompute('iraq', iraqPreProcess)` in `src/index.ts`.
- [ ] Unit tests for filter, sort, and position index.

## 3. Pure Logic

- [ ] `src/findWordForTile.ts`: implement scan-setting branches + CL2 iconicWord override (D3).
- [ ] Unit tests covering scan=1/2/3, fallback path, iconicWord override.

## 4. Presenter: `<IraqScreen>`

- [ ] Define `IraqScreenProps`: `tilesOnPage`, `overlayTileIndex`, `overlayWord`, `page`, `pageCount`, `onTilePress`, `onPrev`, `onNext`.
- [ ] Implement `<IraqScreen>`:
  - 5×7 tile grid (35 cells); empty cells when last page is partial.
  - Overlaid tile shows word text (white background) and the word image.
  - Prev/next arrows; hidden at first/last page.
- [ ] Storybook stories: page 1, last page partial, overlay active.

## 5. Container: `<IraqContainer>`

- [ ] Implement `<IraqContainer>`:
  - `usePrecompute('iraq')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
  - State: `page`, `overlayTileIndex`, `overlayWord`. Refs: pending audio + 2 s timers.
  - `onTilePress(index)`: play tile audio; on resolve + 500 ms → set overlay; schedule restore 2 s later.
  - `onPrev` / `onNext`: clear pending timers + overlay; bounded page change.
  - Cleanup timers on unmount.
  - MUST NOT call `incrementPointsAndTracker`.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-iraq/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-iraq`.
- [ ] Test: `nx test alphaTiles-feature-game-iraq`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — paginate, tap tiles, confirm overlay restore and that no points are recorded.
