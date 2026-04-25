# Tasks: Game Georgia (First Sound)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/georgia/spec.md`.
- [ ] Read `Georgia.java` to confirm CL banding, distractor inclusion, and PC→LV rule.
- [ ] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-georgia --directory=libs/alphaTiles/feature-game-georgia --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-georgia": ["libs/alphaTiles/feature-game-georgia/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/georgia.tsx`. Renders `<GeorgiaContainer />`.

## 2. Precompute

- [ ] Implement `src/georgiaPreProcess.ts`:
  - Build `corV` (C and V tiles only).
  - Build `similarPrefix` map for tiles and syllables (entries that share initial characters with each key).
- [ ] Register: `registerPrecompute('georgia', georgiaPreProcess)` in `src/index.ts`.
- [ ] Unit tests covering pool construction.

## 3. Pure Logic

- [ ] `src/countForLevel.ts`: returns 6/12/18 from level.
- [ ] `src/correctFor.ts`: derives `correct` per band — first tile, or first non-LV tile (with PC→preceding-LV rule).
- [ ] `src/buildChoices.ts`: easy random-sample variant + hard distractor+similar-prefix variant for both T and S.
- [ ] `src/wordStartsWithCorV.ts`: word-filter predicate.
- [ ] Unit tests for each helper.

## 4. Presenter: `<GeorgiaScreen>`

- [ ] Define `GeorgiaScreenProps`: `wordImage`, `wordText`, `revealed`, `choices`, `gridShape`, `onChoice`, `onRepeat`, `disabled`.
- [ ] Implement `<GeorgiaScreen>`:
  - Word image + (optional) revealed text.
  - Grid of choices laid out per `gridShape` (6 / 12 / 18).
  - Repeat-word button.
- [ ] Storybook stories: 6-grid, 12-grid, 18-grid, won state with revealed word.

## 5. Container: `<GeorgiaContainer>`

- [ ] Implement `<GeorgiaContainer>`:
  - `usePrecompute('georgia')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - On mount and on `onPlayAgain`: pick word retrying via `wordStartsWithCorV`; compute `correct` per band; build choices; `playWord()`.
  - State: `prompt`, `choices`, `correct`, `revealed`, `wrongPicks`.
  - `onChoice(text)`: if equals `correct` → reveal word text, gray non-correct, `incrementPointsAndTracker(1)`, `playCorrectThenWord()`, advance arrow blue. Else `playIncorrect()`, track wrong.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-georgia/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-georgia`.
- [ ] Test: `nx test alphaTiles-feature-game-georgia`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1/4/7/10 + S-CL1/4 paths.
