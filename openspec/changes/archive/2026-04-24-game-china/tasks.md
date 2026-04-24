## 0. Preflight

- [ ] 0.1 Read `AGENTS.md` and `openspec/AGENT_PROTOCOL.md`
- [ ] 0.2 Read this change's `proposal.md` and `design.md` in full
- [ ] 0.3 Read required upstream change design docs (see `design.md → ## Context`)
- [ ] 0.4 Read required `docs/ARCHITECTURE.md` sections and referenced ADRs
- [ ] 0.5 Open the source Java files named in `design.md → ## Context`; keep them in view during implementation
- [ ] 0.6 Open the fixture files named in `design.md → ## Context`; verify pack content matches the assumptions the design makes
- [ ] 0.7 Confirm upstream changes are merged (`openspec status --all`); do not start if an upstream is only in-progress
- [ ] 0.8 Confirm `APP_LANG` and `PUBLIC_LANG_ASSETS` env vars are set for local runs
- [ ] 0.9 Confirm `nx graph` shows the libs this change will touch don't already exist with conflicting tags

## 1. `libs/alphaTiles/feature-game-china` scaffolding

- [ ] 1.1 Scaffold lib: `nx g @nx/js:lib feature-game-china --directory=libs/alphaTiles/feature-game-china --tags='type:feature,scope:alphaTiles'`
- [ ] 1.2 Confirm `nx graph` shows the lib and `project.json` has tags applied
- [ ] 1.3 Set up Jest config for pure-logic unit tests (no RN renderer)
- [ ] 1.4 Add empty Storybook `feature-game-china.stories.tsx` scaffold

## 2. Pure-logic helpers

- [ ] 2.1 Implement `src/isSlideable.ts` — port `China.java:348–373`, signature `isSlideable(index: number, blankIndex: number, columns?: number): boolean`; default columns = 4
- [ ] 2.2 Jest tests for `isSlideable`: corner cells (0, 3, 12, 15), edge cells, center cells, wrap-around non-slideability (index 3 → index 4 should be unslideable even though neighbor index is numerically adjacent)
- [ ] 2.3 Implement `src/swapTiles.ts` — signature `swapTiles(board: string[], indexA: number, indexB: number): { board: string[]; blankIndex: number }`; returns a new array (immutable)
- [ ] 2.4 Jest tests for `swapTiles` — blank tracks correctly in both directions
- [ ] 2.5 Implement `src/chooseWords.ts` — ports `China.java:130–156`, signature per design.md D4; returns discriminated union including `{ error: 'insufficient-content' }` when pools are too small
- [ ] 2.6 Jest tests for `chooseWords` with seeded RNG: happy path, 3-tile pool empty (error), 4-tile pool < 3 (error), 4-tile pool exactly 3
- [ ] 2.7 Implement `src/setUpTiles.ts` — ports `China.java:171–221`, signature per design.md D5; shuffles via `moves` iterations of slideable-swap
- [ ] 2.8 Jest tests for `setUpTiles` with seeded RNG: correct `boardText.length === 16`, blank always present, `moves=5` produces a deterministic board, `moves=15` produces a more-shuffled board
- [ ] 2.9 Implement `src/checkRowSolved.ts` — ports `China.java:278–335`, signature per design.md D6; uses `util-phoneme.combineTilesToMakeWord` + `standardizeWordSequence`
- [ ] 2.10 Jest tests for `checkRowSolved`: row 0..2 (four-tile) solve true positive / negative, row 3 (three-tile) blank-at-14 solved, row 3 blank-at-15 solved, row 3 blank-at-12 or -13 NOT solved (porting the Java-line-300 constraint verbatim), RTL script wiring

## 3. Precompute registration

- [ ] 3.1 Implement `src/buildChinaData.ts` — signature `buildChinaData(assets: LangAssets): { threeTileWords: Word[]; fourTileWords: Word[] }`
- [ ] 3.2 Register at module-top-level: `registerPrecompute('china', buildChinaData)` in `src/index.ts`
- [ ] 3.3 Confirm `import '@alphaTiles/feature-game-china';` triggers the registration (import side-effect pattern — same as `util-precompute` examples in design D3 of `port-foundations`)
- [ ] 3.4 Jest test: with a fake `LangAssets`, `buildChinaData` correctly buckets 3-tile vs 4-tile vs other words; logs a warning (not throw) when neither bucket has enough entries

## 4. `<ChinaContainer>` and `<ChinaScreen>`

- [ ] 4.1 Implement `src/ChinaContainer.tsx`:
  - [ ] 4.1.1 Read route-carried params via props (container is invoked by `china.tsx` route which forwards `useLocalSearchParams()`)
  - [ ] 4.1.2 `const shell = useGameShell()` — access score/tracker/audio helpers
  - [ ] 4.1.3 `const data = usePrecompute<ChinaData>('china')`
  - [ ] 4.1.4 `const { scriptType } = useLangInfo()`
  - [ ] 4.1.5 `const tileList = useTileList()`
  - [ ] 4.1.6 `const [board, setBoard] = useState<string[]>([])`, `blankIndex`, `solvedLines`, `currentWords`
  - [ ] 4.1.7 `startRound()` = `chooseWords` + `setUpTiles` in a bounded retry loop (max 5 tries), set state; calls `shell.setRefWord` with the three-tile word
  - [ ] 4.1.8 `onTilePress(i)` = `setInteractionLocked(true)` → if `isSlideable` → `swapTiles` → for each of 4 rows compute `checkRowSolved` → if `areAllLinesSolved` then `shell.incrementPointsAndTracker(4)` + `shell.playCorrectFinal()` else `setInteractionLocked(false)`
  - [ ] 4.1.9 `onImagePress(i)` = `shell.replayWord(i === 3 ? threeTileWord : fourTileWords[i])` (ports `China.java:376–387` clickPicHearAudio)
  - [ ] 4.1.10 `onRepeatPress()` = `startRound()` (ports `China.java:97–103 repeatGame`) — gated by `shell.isRepeatLocked()`
  - [ ] 4.1.11 All user-visible strings resolve via `useTranslation()`: `chrome:a11y.tile`, `chrome:a11y.word`, `game:88.instruction`
  - [ ] 4.1.12 Pass through to shell: `showInstructionsButton={!!instructionAudioName}`, `confirmOnBack={false}`
- [ ] 4.2 Implement `src/ChinaScreen.tsx` as pure props→JSX:
  - [ ] 4.2.1 Layout: `<View>` with left column of 4 `<Tile imageSource>`s and right region holding `<GameBoard columns={4}>` of 16 `<Tile>`s
  - [ ] 4.2.2 Apply row-color state: each row paints green when solved, white on blank cell, black otherwise (ports `China.java:310–333`)
  - [ ] 4.2.3 Zero hook imports; zero i18n imports; all strings arrive as props
- [ ] 4.3 Wire `<GameShellContainer>` as outer wrapper: `<GameShellContainer …><ChinaScreen … /></GameShellContainer>`

## 5. Route wiring

- [ ] 5.1 Create `apps/alphaTiles/app/games/china.tsx`:
  - [ ] 5.1.1 Import `ChinaContainer` from `@alphaTiles/feature-game-china`
  - [ ] 5.1.2 Read route params via `useLocalSearchParams` and forward to container
- [ ] 5.2 Confirm `aa_games.txt` door 88 dispatches to `/games/china` (game-menu change owns the routing table; this change only verifies the destination exists and renders)

## 6. Storybook

- [ ] 6.1 Story: fresh shuffle (all rows unsolved)
- [ ] 6.2 Story: one row solved (green)
- [ ] 6.3 Story: three rows solved, bottom row unsolved
- [ ] 6.4 Story: all rows solved (pre-celebration)
- [ ] 6.5 Story: insufficient-content error screen
- [ ] 6.6 Story: RTL layout (script direction forced via storybook decorator)

## 7. Manual QA

- [ ] 7.1 `APP_LANG=eng nx start alphaTiles` — navigate to door 88, play a round to completion, verify points + tracker increments land correctly in `data-progress`
- [ ] 7.2 Verify audio-replay button plays the active three-tile word prompt
- [ ] 7.3 Verify tapping any of the 4 word-image prompts plays the corresponding word audio
- [ ] 7.4 Verify `challengeLevel` 1 / 2 / 3 produce progressively more-shuffled boards (5 / 10 / 15 moves)
- [ ] 7.5 Verify 12 correct completions (12 × 4 points = 48 points) trigger `<Celebration>` under `after12CheckedTrackers = 3`
- [ ] 7.6 Verify hardware-back returns to Earth

## 8. Housekeeping

- [ ] 8.1 Confirm `nx lint` passes on `feature-game-china` (enforce-module-boundaries should allow only feature-game-shell, data-language-assets, data-audio, util-phoneme, util-stages, util-scoring, util-precompute, util-i18n, util-theme, util-analytics, ui-tile, ui-game-board)
- [ ] 8.2 Confirm `npx tsc --noEmit` passes workspace-wide
- [ ] 8.3 Short `libs/alphaTiles/feature-game-china/README.md` documenting that this is the exemplar feature-game-* lib and the pattern future games should follow
- [ ] 8.4 Run `openspec validate game-china --strict` and resolve findings
