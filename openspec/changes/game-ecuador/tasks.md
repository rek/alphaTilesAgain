# Tasks: Game Ecuador (Scatter Word Match)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/ecuador/spec.md`.
- [ ] Read `Ecuador.java` to confirm tile-count (8), retry budget (10 000), and 2-point award.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-ecuador --directory=libs/alphaTiles/feature-game-ecuador --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-ecuador": ["libs/alphaTiles/feature-game-ecuador/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/ecuador.tsx`. Renders `<EcuadorContainer />`.

## 2. Pure Logic

- [ ] `src/placeTiles.ts`: non-overlapping random placement with up-to-10 000 attempts per tile. Returns `null` on failure.
- [ ] `src/pickRound.ts`: shuffle wordPool; pick prompt + 7 distractors, all distinct.
- [ ] Unit tests: non-overlap invariant under seeded RNG; round picks all distinct.

## 3. Presenter: `<EcuadorScreen>`

- [ ] Define `EcuadorScreenProps`: `promptImage`, `tiles`, `grayed`, `onPress`, `onRepeat`, `disabled`.
- [ ] Implement `<EcuadorScreen>`:
  - Prompt image at top.
  - Absolute-positioned tile views using `tile.x/y/width`.
  - Repeat-word button.
- [ ] Storybook stories: fresh round, mid-round (3 grayed), won.

## 4. Container: `<EcuadorContainer>`

- [ ] Implement `<EcuadorContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - Read screen dimensions; configure `placeTiles` with min/max widths derived from screen size.
  - State: `prompt`, `tiles`, `grayed`, `disabled`.
  - On mount and on `onPlayAgain`: pick round, place tiles (retry on `null`), `playWord()`.
  - `onTilePress(text)`: if equals stripped `prompt.wordInLOP` → `incrementPointsAndTracker(2)`, gray non-correct, `playCorrectThenWord()`, set advance arrow blue. Else `playIncorrect()`, track wrong.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-ecuador/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-ecuador`.
- [ ] Test: `nx test alphaTiles-feature-game-ecuador`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify scatter, correct/wrong feedback, replay.
