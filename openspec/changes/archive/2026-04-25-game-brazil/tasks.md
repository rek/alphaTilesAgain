# Tasks: Game Brazil (Find the Missing Tile)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/brazil/spec.md`.
- [x] Read `Brazil.java` to confirm CL→pool mapping and tile-type filter.
- [x] Confirm `game-engine-base` is archived.

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-brazil --directory=libs/alphaTiles/feature-game-brazil --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-brazil": ["libs/alphaTiles/feature-game-brazil/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/brazil.tsx`. Renders `<BrazilContainer />`.

## 2. Precompute

- [x] Implement `src/brazilPreProcess.ts`:
  - Build `vowels`, `consonants`, `tones`, `syllables`, `multitypeTiles` per D5.
  - Shuffle each pool at build time (game also re-shuffles per round).
- [x] Register: `registerPrecompute('brazil', brazilPreProcess)` in `src/index.ts`.
- [x] Unit tests for `brazilPreProcess`: tile-type filtering, multi-type detection.

## 3. Pure Logic

- [x] `src/blankRandomTileOfType.ts`: blank one tile in parsed array of given type; never SAD.
- [x] `src/buildChoices.ts`: per-CL choice list (4 / distractor trio / up-to-15 / tones).
- [x] `src/buildSyllableChoices.ts`: SL1 / SL2 variants.
- [x] `src/pickWordOfType.ts`: choose word from `chooseWord()` retrying until parsed tiles include required type.
- [x] Unit tests covering each helper.

## 4. Presenter: `<BrazilScreen>`

- [x] Define `BrazilScreenProps`: `displayTiles`, `choices`, `wordImage`, `onChoice`, `onRepeat`, `visibleChoiceCount`, `repeatLocked`.
- [x] Implement `<BrazilScreen>`:
  - Word image at top; partial word with `"__"` placeholder rendered as a row of tiles.
  - Choice row: 4 (or up to 15) tile buttons; tones-CL7 hides buttons beyond `TONES.length` up to 4.
  - Repeat-word button (advance arrow) — disabled when `repeatLocked`.
- [x] Storybook stories: CL1, CL3 (15 tiles), CL7 (2 visible tones), SL1, correct-revealed state.

## 5. Container: `<BrazilContainer>`

- [x] Implement `<BrazilContainer>`:
  - `usePrecompute('brazil')`, `useGameShell()`, `useLangAssets()`, `useAudio()`, `useProgress()`.
  - State: `parsedTiles`/`parsedSyllables`, `choices`, `correct`, `wrongPicks`.
  - On mount and on `onPlayAgain`: pick word, blank tile, build choices, `playWord()`.
  - `onChoice(text)`: if `text === correct.text` → `incrementPointsAndTracker(1)`, reveal full word, gray non-correct, `playCorrectThenWord()`. Else `playIncorrect()`, track wrong.
  - `onRepeat()`: re-play current word audio (only when `!repeatLocked`).
- [x] Wrap with `<GameShellContainer>`.

## 6. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-brazil/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-brazil` (pending).
- [x] Test: `nx test alphaTiles-feature-game-brazil` (4 suites pass).
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — verify CL1, CL3, CL7 paths and SL variants. **Deferred**: Expo dev server not runnable in this sandbox; needs human QA.
