# Tasks: Game Japan (Syllable Segmentation)

## 0. Preflight

- [x] Read `proposal.md`, `design.md`, and `specs/japan/spec.md`.
- [x] Read `Japan.java` (Android source) to confirm join/separate logic and evaluation algorithm.
- [x] Confirm `game-engine-base` is archived (upstream merged).

## 1. Library Scaffold

- [x] Generate library: `nx g @nx/react-native:lib feature-game-japan --directory=libs/alphaTiles/feature-game-japan --tags='type:feature,scope:alphaTiles'`.
- [x] Add path alias to `tsconfig.base.json`: `"@alphaTiles/feature-game-japan": ["libs/alphaTiles/feature-game-japan/src/index.ts"]`.
- [x] Create route: `apps/alphaTiles/app/games/japan.tsx`. Renders `<JapanContainer />`.

## 2. Pure Logic

- [x] Implement `src/evaluateGroupings.ts`: given `groups: TileGroup[]` and `correctSyllables: string[][]`, return set of locked group indices.
- [x] Implement `src/joinTiles.ts`: merge two adjacent groups (remove boundary between them).
- [x] Implement `src/separateTiles.ts`: split a group back into individual tiles.
- [x] Unit tests for `evaluateGroupings`: partial match, full match, no match, reordered groups.
- [x] Unit tests for join/separate: verify group count and tile contents.

## 3. Presenter: `<JapanScreen>`

- [x] Define `JapanScreenProps`:
  - `groups: Array<{ tiles: string[]; isLocked: boolean }>`.
  - `boundaries: Array<{ index: number; visible: boolean }>`.
  - `onJoin: (boundaryIndex: number) => void`.
  - `onSeparate: (groupIndex: number) => void`.
  - `wordText: string`, `wordImage?: ImageSource`.
- [x] Implement `<JapanScreen>`:
  - Horizontal row of tile groups interleaved with link buttons.
  - Locked groups styled GREEN; others default color.
  - Link buttons hidden between locked/adjacent-locked groups.
  - Word text and image displayed above.
- [x] Storybook stories: 3-tile word (initial), 7-tile word (initial), partial GREEN, fully won.

## 4. Container: `<JapanContainer>`

- [x] Implement `<JapanContainer>`:
  - `useGameShell()`, `useLangAssets()`.
  - State: `tiles`, `groups`, `correctSyllables`, `isWon`.
  - On mount / new round: `chooseWord` retrying until tile count ≤ MAX_TILES for the level.
  - Remove SAD tiles from `parsedRefWordTileArray`.
  - Compute `correctSyllables` from `parsedRefWordSyllableArray`.
  - `onJoin(boundaryIndex)` and `onSeparate(groupIndex)`: update `groups`, call `evaluateGroupings`, check win.
  - Win: `updatePointsAndTrackers(1)` + `playCorrectSoundThenActiveWordClip`.
  - Force landscape orientation on mount (restore on unmount).
- [x] Wrap with `<GameShellContainer>`.

## 5. Verification

- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-japan/tsconfig.lib.json`.
- [x] Lint: `nx lint feature-game-japan`.
- [x] Test: `nx test feature-game-japan`.
- [ ] Manual smoke test: `APP_LANG=eng nx serve alphaTiles` — verify partial green credit, full win, landscape orientation, RTL layout.
