## 0. Preflight

- [x] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [x] 0.2 Read this change's `proposal.md` and `design.md` in full
- [x] 0.3 Open `UnitedStates.java` (from repo or URL); keep in view
- [x] 0.4 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set
- [x] 0.5 Confirm `nx graph` for new lib tags: `type:feature,scope:alphaTiles`

## 1. `libs/alphaTiles/feature-game-united-states` scaffolding

- [x] 1.1 Scaffold lib: `nx g @nx/js:lib feature-game-united-states --directory=libs/alphaTiles/feature-game-united-states --tags='type:feature,scope:alphaTiles'`
- [x] 1.2 Confirm `nx graph` and `project.json` tags
- [x] 1.3 Set up Jest config for pure-logic unit tests
- [x] 1.4 Add Storybook `UnitedStatesScreen.stories.tsx` scaffold

## 2. Precompute and setup logic

- [x] 2.1 Implement `src/buildUnitedStatesData.ts`:
  - [x] 2.1.1 Signature `buildUnitedStatesData(assets: LangAssets): UnitedStatesData`
  - [x] 2.1.2 Filter words by length (2-5, 2-7, 2-9)
  - [x] 2.1.3 Register via `registerPrecompute('united-states', buildUnitedStatesData)` in `src/index.ts`
- [x] 2.2 Implement `src/setupRound.ts`:
  - [x] 2.2.1 Select a random word from the appropriate bucket
  - [x] 2.2.2 Parse into tiles using `util-phoneme`
  - [x] 2.2.3 For each tile, generate a pair: `{ top: string, bottom: string, correct: 'top' | 'bottom' }`
  - [x] 2.2.4 Randomize distractor selection from tile's alternatives
- [x] 2.3 Jest tests for `setupRound.ts`: verify pairs contain correct tile and one distractor, verify randomization

## 3. `<UnitedStatesContainer>` and `<UnitedStatesScreen>`

- [x] 3.1 Implement `src/UnitedStatesContainer.tsx`:
  - [x] 3.1.1 Read `challengeLevel` from route params
  - [x] 3.1.2 `useGameShell()` and `usePrecompute('united-states')`
  - [x] 3.1.3 State: `currentWord`, `pairs`, `selections` (index of selected tile in each pair or `null`)
  - [x] 3.1.4 `onTilePress(pairIndex, tileIndex)`: update `selections`, check win condition
  - [x] 3.1.5 `checkWin()`: if all pairs selected and match target word → `shell.incrementPointsAndTracker(2)` + `shell.playCorrectFinal()`
  - [x] 3.1.6 Derived state: `constructedWord` string (using `_` for empty)
  - [x] 3.1.7 Pass translated labels to screen
- [x] 3.2 Implement `src/UnitedStatesScreen.tsx`:
  - [x] 3.2.1 Layout: image at top, grid of pairs (2 rows), constructed word display at bottom
  - [x] 3.2.2 Use `ui-tile` for each button
  - [x] 3.2.3 Tile colors: cycling theme colors for selected, dark gray for unselected
  - [x] 3.2.4 Handle RTL layout via logical style props
- [x] 3.3 Wire `<GameShellContainer>` wrapper

## 4. Route wiring

- [x] 4.1 Create `apps/alphaTiles/app/games/united-states.tsx`
- [x] 4.2 Forward `useLocalSearchParams` to `UnitedStatesContainer`

## 5. Storybook and QA

- [x] 5.1 Stories: level 1 board (5 pairs), level 3 board (9 pairs), partial selection, all selected correct, RTL layout
- [ ] 5.2 Manual QA: verify round setup, win detection, audio playback on completion, back button behavior
- [x] 5.3 Verify `nx lint` and `npx tsc --noEmit` pass

## 6. Housekeeping

- [x] 6.1 `libs/alphaTiles/feature-game-united-states/README.md`
- [x] 6.2 Run `openspec validate game-united-states --strict`
