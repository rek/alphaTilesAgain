# Tasks: Game Japan

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/japan/spec.md`.
- [ ] Read `Japan.java` (Android source) to confirm missing-tile selection and distractor logic.
- [ ] Confirm `game-engine-base` and `game-china` are archived (upstream merged).

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-japan --directory=libs/alphaTiles/feature-game-japan --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-japan": ["libs/alphaTiles/feature-game-japan/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/japan.tsx`. Renders `<JapanContainer />`.

## 2. Pure Logic & Helpers

- [ ] Implement `src/decodeJapanChallengeLevel.ts`: maps `challengeLevel` to choice count (1→2, 2→4, 3→6).
- [ ] Implement `src/pickJapanRound.ts`: selects `refWord` via `util-stages`, parses into tiles via `util-phoneme`, picks a random `missingTileIndex`, picks N-1 distractor tiles (distinct from correct tile) from cumulative stage tile list, shuffles all N into `choices`.
- [ ] Unit tests for `pickJapanRound`: verify correct tile always in choices, distractors are distinct, `missingTileIndex` is valid.

## 3. Presenter: `<JapanScreen>`

- [ ] Define `JapanScreenProps`: `wordTiles: Array<{ text: string; isMissing: boolean }>`, `choices: Array<{ tile: Tile }>`, `onChoicePress: (i: number) => void`, optional `refImage?: ImageSource`.
- [ ] Implement `<JapanScreen>`: renders word tiles row (missing tile as blank/`?` placeholder) + choice tile grid.
- [ ] Storybook stories: 2-choice round, 4-choice round, 6-choice round.

## 4. Container: `<JapanContainer>`

- [ ] Implement `<JapanContainer>`:
  - `useGameShell()`, `useLangAssets()`.
  - `startRound()`: calls `pickJapanRound`, sets state.
  - `onChoicePress(i)`: correct → `shell.incrementPointsAndTracker(1)` + next round; incorrect → `shell.playIncorrect()`.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-japan/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-japan`.
- [ ] Test: `nx test alphaTiles-feature-game-japan`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles`.
