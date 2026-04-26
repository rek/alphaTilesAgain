# Tasks: Game Sudan (Tile/Syllable Audio Browser)

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, and `specs/sudan/spec.md`.
- [ ] Read `Sudan.java` to confirm filter, page sizes, type-colour mapping.
- [ ] Confirm `game-engine-base` is archived and that NO_TRACKER guard is in `GameShellContainer`.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-sudan --directory=libs/alphaTiles/feature-game-sudan --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-sudan": ["libs/alphaTiles/feature-game-sudan/src/index.ts"]`.
- [ ] Create route: `apps/alphaTiles/app/games/sudan.tsx`. Renders `<SudanContainer />`.

## 2. Precompute

- [ ] Implement `src/sudanPreProcess.ts`:
  - Tiles: filter SAD / silent placeholders; paginate 63/page.
  - Syllables: paginate 35/page from `syllableList`.
- [ ] Register: `registerPrecompute('sudan', sudanPreProcess)` in `src/index.ts`.
- [ ] Unit tests for filter + pagination.

## 3. Pure Logic

- [ ] `src/tileColor.ts`: per type per D2.
- [ ] `src/syllableColor.ts`: uses syllable's own colour index.
- [ ] Unit tests covering each branch.

## 4. Presenter: `<SudanScreen>`

- [ ] Define `SudanScreenProps`: discriminated union `{ variant: 'T'; tiles; onTile } | { variant: 'S'; syllables; onSyllable }` plus `page`, `pageCount`, `onPrev`, `onNext`, `disabled`.
- [ ] Implement `<SudanScreen>`:
  - Tile variant: grid sized for up to 63 cells; cell text colour = `tile.color`.
  - Syllable variant: grid for up to 35 cells; non-tappable syllables visibly muted.
  - Prev/next arrows; hidden at first/last page.
- [ ] Storybook stories: tile page (full 63), syllable page, syllable page with greyed no-audio entries.

## 5. Container: `<SudanContainer>`

- [ ] Implement `<SudanContainer>`:
  - `usePrecompute('sudan')`, `useGameShell()`, `useLangAssets()`, `useAudio()`.
  - Variant from `syllableGame`.
  - State: `page`, `disabled`. Refs to in-flight audio for cancel.
  - `onTilePress(index)` / `onSyllablePress(index)`: gated by `disabled` and (for syllables) `hasSyllableAudio`; await audio; clear `disabled`.
  - `onPrev` / `onNext`: bounded; cancel pending audio + reset `disabled`.
  - MUST NOT call `incrementPointsAndTracker`.
- [ ] Wrap with `<GameShellContainer>`.

## 6. Verification

- [ ] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-sudan/tsconfig.lib.json`.
- [ ] Lint: `nx lint alphaTiles-feature-game-sudan`.
- [ ] Test: `nx test alphaTiles-feature-game-sudan`.
- [ ] Manual smoke: `APP_LANG=eng nx serve alphaTiles` — tile + syllable variants; confirm no points awarded.
