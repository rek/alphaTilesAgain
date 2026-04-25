# Tasks: Game Chile

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/chile/spec.md`.
- [ ] Read `Chile.java` (Android source) to confirm distractor logic and choice count per level.
- [ ] Confirm `game-engine-base` and `game-china` are archived (upstream merged).

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-chile --directory=libs/alphaTiles/feature-game-chile --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-chile": ["libs/alphaTiles/feature-game-chile/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/chile.tsx`. Renders `<ChileContainer />`.

## 2. Pure Logic & Helpers

- [ ] Implement `src/pickChileChoices.ts`: selects `refWord` via `util-stages`, picks 3 distractor words (distinct from `refWord`), shuffles all 4 into `choices`.
- [ ] Unit tests for `pickChileChoices`: verify correct word is always in choices, distractors are distinct, order is randomized.

## 3. Presenter: `<ChileScreen>`

- [ ] Define `ChileScreenProps`: `refImage: ImageSource`, `choices: Array<{ word: Word; disabled: boolean }>`, `onChoicePress: (i: number) => void`.
- [ ] Implement `<ChileScreen>`: renders image prompt + 4 `<Tile>` word buttons. Disabled choices rendered grayed-out.
- [ ] Storybook stories: initial state, one incorrect choice disabled, correct selected.

## 4. Container: `<ChileContainer>`

- [ ] Implement `<ChileContainer>`:
  - `useGameShell()`, `useLangAssets()`.
  - `startRound()`: calls `pickChileChoices`, sets `refWord` and `choices` state.
  - `useMountEffect(() => shell.replayWord(refWord))` — plays word audio on each round start.
  - `onChoicePress(i)`: correct → `shell.incrementPointsAndTracker(1)` + next round; incorrect → `shell.playIncorrect()` + disable that choice.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-chile/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-chile`.
- [ ] Test: `nx test alphaTiles-feature-game-chile`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles`.
