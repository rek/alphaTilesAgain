# Tasks: Game Peru (4-Choice Word Recognition)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/peru/spec.md`.
- [ ] Read `Peru.java` to confirm CL distractor strategies, dedupe loop, Arabic ligature filter.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-peru --directory=libs/alphaTiles/feature-game-peru --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-peru": ["libs/alphaTiles/feature-game-peru/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/peru.tsx`. Renders `<PeruContainer />`.

## 2. Pure Logic

- [ ] `src/buildWrong.ts`: per-CL distractor strategy per D2.
- [ ] `src/buildAllChoices.ts`: ensures 4 unique choices; filters Arabic ligature `للہ` per D3.
- [ ] Unit tests: each CL produces correctly-mutated wrong answer; no duplicates; forbidden substring rejected.

## 3. Presenter: `<PeruScreen>`

- [ ] Define `PeruScreenProps`: `wordImage`, `choices`, `onChoice`, `onRepeat`, `disabled`.
- [ ] Implement `<PeruScreen>`:
  - Word image at top (tappable to repeat).
  - 2×2 grid of 4 choice buttons; grayed when `choices[i].grayed`.
- [ ] Storybook stories: fresh round, mid-round (3 grayed), won state.

## 4. Container: `<PeruContainer>`

- [ ] Implement `<PeruContainer>`:
  - `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - State: `prompt`, `choices`, `correct`, `wrongPicks`, `grayed`.
  - On mount and on `onPlayAgain`: choose word; build choices via `buildAllChoices`; `playWord()`. If `buildAllChoices` cannot fill 4 unique entries → re-pick word.
  - `onChoice(text)`: if equals `correct` → gray non-correct, `incrementPointsAndTracker(2)`, `playCorrectThenWord()`, advance arrow blue. Else `playIncorrect()`, track wrong.
  - `onRepeat()` (also on image tap): replay active word clip.
- [ ] Wrap with `<GameShellContainer>`.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-peru/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-peru`.
- [ ] Test: `nx test alphaTiles-feature-game-peru`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1/2/3 distractor patterns and image-tap repeat.
