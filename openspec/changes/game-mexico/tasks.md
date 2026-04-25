# Tasks

Implement the 'Mexico' game (Matching/Memory).

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] Read `Mexico.java`.
- [x] Verify `game-engine-base` and `game-china` are merged.

## 1. Library & Route Setup

- [x] Generate library: `./nx g @nx/react-native:lib feature-game-mexico --directory=libs/alphaTiles/feature-game-mexico --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-mexico": ["libs/alphaTiles/feature-game-mexico/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/mexico.tsx`. Renders `<MexicoContainer />`.

## 2. Precompute & Helpers

- [x] Implement `buildMexicoData.ts`: filters words with both image and audio.
- [x] Register precompute in `libs/alphaTiles/feature-game-mexico/src/index.ts`.
- [x] Implement `setupMexicoBoard.ts`: picks words, creates pairs (TEXT/IMAGE), shuffles.
- [x] Unit tests for `setupMexicoBoard`.

## 3. MexicoScreen (Presenter)

- [x] Define `MexicoScreenProps`.
- [x] Implement `<MexicoScreen>`:
  - Responsive grid of cards.
  - Card component:
    - Face-down: AlphaTiles logo (via `asset-runtime`).
    - Face-up: Word text (styled by theme) or Word image.
    - Paired: Styled with theme color (matches Java line 309).
- [x] Storybook stories for `<MexicoScreen>` in `libs/alphaTiles/feature-game-mexico/src/MexicoScreen.stories.tsx`.

## 4. MexicoContainer

- [x] Implement `<MexicoContainer>`:
  - Hooks: `useGameShell`, `usePrecompute`, `useLangAssets`.
  - State: `cards: CardState[]`, `firstIdx: number | null`.
  - Effect: On second card selected, trigger match logic after `REVEAL_DELAY`.
  - `onCardPress(index)`: handles selection, reveal, and ignoring clicks on revealed/paired cards.
  - Win logic: `shell.incrementPointsAndTracker(true)` and `shell.playCorrectFinal()`.
  - Restart logic: wired to shell's advance arrow.

## 5. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-mexico/tsconfig.lib.json`.
- [x] Lint: `nx lint alphaTiles-feature-game-mexico`.
- [ ] Manual smoke test (Web): `APP_LANG=eng nx serve alphaTiles`.
- [ ] Verify RTL: Test with a RTL language pack if available (or simulated).
