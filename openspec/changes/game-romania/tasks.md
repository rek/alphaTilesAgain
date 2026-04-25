# Tasks: Game Romania

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/romania/spec.md`.
- [x] Read `Romania.java` (Android source) to confirm `scanSetting` logic and tile cycling.
- [x] Confirm `game-engine-base` is archived (upstream merged).
- [x] Check `libs/alphaTiles/util-scoring/src/lib/noTrackerCountries.ts` — verify Romania is listed.

## 1. Precompute

- [x] Implement `src/buildRomaniaData.ts`: iterates all words, parses each into tiles via `util-phoneme`, builds `Record<tileId, Word[]>` mapping.
- [x] Register: `registerPrecompute('romania', buildRomaniaData)` in `src/index.ts`.
- [x] Unit test: verify a known word appears under the correct tile key.

## 2. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-romania --directory=libs/alphaTiles/feature-game-romania --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-romania": ["libs/alphaTiles/feature-game-romania/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/romania.tsx`. Renders `<RomaniaContainer />`.

## 3. Pure Logic

- [x] Implement `src/filterWordsForTile.ts`: given `wordsForTile: Word[]` and `scanSetting`, returns filtered list per D2 rules.
- [x] Unit tests for all three `scanSetting` values.

## 4. Presenter: `<RomaniaScreen>`

- [x] Define `RomaniaScreenProps`: `focusTileText: string`, `currentWord: Word`, `boldFocusTile: boolean`, `onNext: () => void`.
- [x] Implement `<RomaniaScreen>`: renders focus tile + word (split into tiles, bold matching ones if `boldFocusTile`). "Next" button or tap advances.
- [x] Storybook stories: bolding on/off, long word, short word.

## 5. Container: `<RomaniaContainer>`

- [x] Implement `<RomaniaContainer>`:
  - `useGameShell()`, `usePrecompute('romania')`, `useLangAssets()`.
  - State: `focusTile`, `wordsForTile`, `wordIndex`.
  - Applies `filterWordsForTile` using `settings.scanSetting`.
  - `onNext()`: advances `wordIndex`; when exhausted, follows shell's stage progression.
  - Never calls `shell.incrementPointsAndTracker` (NO_TRACKER_COUNTRY).
- [x] Wrap with `<GameShellContainer>`.

## 6. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-romania/tsconfig.lib.json`.
- [x] Lint: `nx lint alphaTiles-feature-game-romania`.
- [x] Test: `nx test alphaTiles-feature-game-romania`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles`.
- [ ] Verify `scanSetting` 1, 2, 3 behavior with `engEnglish4`.
- [ ] Verify `boldInitialFocusTiles` on/off.
