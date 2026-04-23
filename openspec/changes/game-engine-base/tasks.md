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

## 1. `libs/alphaTiles/util-scoring`

- [ ] 1.1 Scaffold lib: `nx g @nx/js:lib util-scoring --directory=libs/alphaTiles/util-scoring --tags='type:util,scope:alphaTiles'`
- [ ] 1.2 Implement `shouldIncrementTracker(country)` with `NO_TRACKER_COUNTRIES = ['Romania','Sudan','Malaysia','Iraq']`
- [ ] 1.3 Implement `addPoint(current, delta)` (clamp non-negative)
- [ ] 1.4 Implement `computeTrackerCount(previous, isCorrect, country)`
- [ ] 1.5 Implement `isGameMastered(trackerCount, checked12Trackers, after12CheckedTrackers)`
- [ ] 1.6 Implement `pointsForStage(stage, isCorrect)` — v1: +1 when correct, else 0
- [ ] 1.7 Implement `displayChallengeLevel(country, challengeLevel)` — Thailand divides by 100; Brazil subtracts 3 when >3 && !=7; Georgia subtracts 6 when >6
- [ ] 1.8 Export `NO_TRACKER_COUNTRIES` constant and `NoTrackerCountry` type
- [ ] 1.9 Unit tests for each function covering the Java source edge cases (tracker-country guard, Thailand/Brazil/Georgia display-level branches, mastery detection across modes 1/2/3)

## 2. `libs/alphaTiles/util-phoneme`

- [ ] 2.1 Scaffold lib: `nx g @nx/js:lib util-phoneme --directory=libs/alphaTiles/util-phoneme --tags='type:util,scope:alphaTiles'`
- [ ] 2.2 Define `ScriptParser` type: `{ parse, combine, standardizeSequence }`
- [ ] 2.3 Implement `registerScriptParser(name, parser)` — throws on duplicate key
- [ ] 2.4 Implement the default unidirectional parser: longest-match left-to-right against `tileList`, respecting `referenceWord.wordInLOP`
- [ ] 2.5 Register the default parser under key `'default'` at module load
- [ ] 2.6 Implement `parseWordIntoTiles(word, tileList, referenceWord, scriptType)` — dispatches to registered parser; falls back to `'default'` with a console.warn if scriptType is not registered
- [ ] 2.7 Implement `combineTilesToMakeWord(tiles, word, indexOfReplacedTile, scriptType)` — dispatches similarly (port `GameActivity.java:952`)
- [ ] 2.8 Implement `standardizeWordSequence(word, scriptType)` (port `GameActivity.java:1211`)
- [ ] 2.9 Implement `stackInProperSequence(assembled, word)` private helper (port `GameActivity.java:1066`)
- [ ] 2.10 Implement `generateProhibitedCharSequences(word)` private helper (port `GameActivity.java:1105`)
- [ ] 2.11 Unit tests: default parser round-trips every word in `languages/eng/` and `languages/tpx/` (parse → combine === standardized); duplicate registration throws; unknown-script fallback logs warn; extension seam smoke-test with a fake `'Thai'` registration
- [ ] 2.12 Document the registry pattern in the library's `src/index.ts` JSDoc header — point at `docs/ARCHITECTURE.md §9` and §16

## 3. `libs/alphaTiles/util-stages`

- [ ] 3.1 Scaffold lib: `nx g @nx/js:lib util-stages --directory=libs/alphaTiles/util-stages --tags='type:util,scope:alphaTiles'`
- [ ] 3.2 Implement `tileStagesLists(tileList, stageOfFirstAppearance)` — returns `Tile[][]` of length 7 (port `Start.java:378 buildTileStagesLists`)
- [ ] 3.3 Implement `wordStagesLists(wordList, tileStages, parseWordIntoTiles, correspondenceRatio)` (port `Start.java:475 buildWordStagesLists`)
- [ ] 3.4 Implement `computeStageCorrespondence(word, stageTiles, parseWordIntoTiles)` — returns 0..1
- [ ] 3.5 Implement `selectWordForStage({ stage, wordStagesLists, previousStagesWordList, cumulativeStageBasedWordList, previouslyShown, correspondenceRatio, rng? })` — stage-ratchet + weighted correspondence + lastXWords avoidance (port `GameActivity.java:417 chooseWord`)
- [ ] 3.6 Accept injected `rng: () => number` (default `Math.random`) for deterministic tests
- [ ] 3.7 Unit tests with seeded RNG over a minimal in-memory tile/word fixture: stage-ratchet fires when stage is empty; stage-1 weighting favors higher correspondence; `previouslyShown` avoidance uses the min(12, stage1Count-1) window

## 4. `libs/alphaTiles/data-progress`

- [ ] 4.1 Scaffold lib: `nx g @nx/js:lib data-progress --directory=libs/alphaTiles/data-progress --tags='type:data-access,scope:alphaTiles'`
- [ ] 4.2 Implement `buildGameUniqueId({ country, challengeLevel, playerId, syllableGame, stage })` — exact match to `GameActivity.java:175 uniqueGameLevelPlayerModeStageID`
- [ ] 4.3 Define `ProgressEntry = { points, trackerCount, checked12Trackers, lastPlayed }`
- [ ] 4.4 Create Zustand store `useProgressStore` with `progress: Record<key, ProgressEntry>` and actions: `incrementPoints`, `incrementTracker`, `markChecked12`, `resetGame`
- [ ] 4.5 Wrap store in `persist` middleware with AsyncStorage driver (ADR-005) — one persist config keyed `alphaTiles.progress.v1`
- [ ] 4.6 Add selector hooks: `useProgressEntry(key)`, `useTotalPoints(playerId)` (sums across all entries for that player)
- [ ] 4.7 Unit tests: key builder string equality; action semantics; `persist` round-trip via AsyncStorage mock; `NO_TRACKER_COUNTRIES` integration (delegates to `util-scoring`)

## 5. `libs/shared/ui-tile`

- [ ] 5.1 Scaffold lib: `nx g @nx/js:lib ui-tile --directory=libs/shared/ui-tile --tags='type:ui,scope:shared'`
- [ ] 5.2 Implement `<Tile>` base: props `{ text?, imageSource?, color, fontColor?, pressed?, onPress, accessibilityLabel }`
- [ ] 5.3 Variants: `<AudioButtonTile>` (renders speaker icon overlay), `<UpperCaseTile>` (renders `tile.upper` text)
- [ ] 5.4 Confirm no `react-i18next` import (enforce-module-boundaries check per ARCHITECTURE §10)
- [ ] 5.5 Storybook stories: text tile, image tile, pressed tile, RTL layout, audio-button variant, upper-case variant
- [ ] 5.6 Port `TileAdapter.ColorTile` shape as the `TileProps` type (text/color/fontColor)

## 6. `libs/shared/ui-game-board`

- [ ] 6.1 Scaffold lib: `nx g @nx/js:lib ui-game-board --directory=libs/shared/ui-game-board --tags='type:ui,scope:shared'`
- [ ] 6.2 Implement `<GameBoard>` with props `{ columns, rows?, children, accessibilityLabel }`
- [ ] 6.3 Use logical props (`marginStart`/`marginEnd`) per ARCHITECTURE §16
- [ ] 6.4 Default to portrait-locked aspect ratio via `useWindowDimensions`
- [ ] 6.5 Storybook stories: 4x4 grid, 3x4 grid, 2x3 grid

## 7. `libs/shared/ui-celebration`

- [ ] 7.1 Scaffold lib: `nx g @nx/js:lib ui-celebration --directory=libs/shared/ui-celebration --tags='type:ui,scope:shared'`
- [ ] 7.2 Add `lottie-react-native` as dep of the workspace (root `package.json`) and expo-install it
- [ ] 7.3 Commit placeholder `apps/alphaTiles/assets/lottie/celebration.json` (confetti animation; swap in final art when design delivers)
- [ ] 7.4 Implement `<Celebration>` — full-screen `LottieView autoPlay loop={false}` + a tap-target to go back; props `{ animationSource, onBackPress, backLabel }`
- [ ] 7.5 Disable hardware back via `useBackHandler` returning `true` during animation
- [ ] 7.6 Storybook story of the celebration screen

## 8. `libs/shared/ui-score-bar`

- [ ] 8.1 Scaffold lib: `nx g @nx/js:lib ui-score-bar --directory=libs/shared/ui-score-bar --tags='type:ui,scope:shared'`
- [ ] 8.2 Implement `<ScoreBar>`: `{ gameNumber, gameColor, challengeLevel, trackerStates, score, scoreLabel }`
- [ ] 8.3 Render 12 tracker icons from props — `zz_complete` / `zz_incomplete` image sources injected via `trackerStates: ('complete'|'incomplete')[]`
- [ ] 8.4 Auto-size text per Android `autoSizeTextType="uniform"` behavior (use React Native's `adjustsFontSizeToFit` + `numberOfLines={1}`)
- [ ] 8.5 Storybook stories: 0 trackers / 5 / 12 / mastered (all 12 complete)

## 9. `libs/alphaTiles/feature-game-shell`

- [ ] 9.1 Scaffold lib: `nx g @nx/js:lib feature-game-shell --directory=libs/alphaTiles/feature-game-shell --tags='type:feature,scope:alphaTiles'`
- [ ] 9.2 Implement `<GameShellContainer>` — reads route params via `expo-router` (`useLocalSearchParams`), resolves `country`, `challengeLevel`, `stage`, `syllableGame`, `gameNumber`, `playerId`
- [ ] 9.3 Subscribe to `useProgressStore` and derive `score`, `trackerCount`, `trackerStates: ('complete'|'incomplete')[]`
- [ ] 9.4 Subscribe to `useAudio()` for `playWord`, `playCorrect`, `playIncorrect`, `playCorrectFinal`, `playInstruction`, `playTile`
- [ ] 9.5 Build `displayedChallengeLevel` via `util-scoring.displayChallengeLevel`
- [ ] 9.6 Expose a `useGameShell()` hook to children — returns `{ incrementPointsAndTracker, replayWord, interactionLocked, setInteractionLocked, refWord, setRefWord }` (everything a mechanic needs from the shell without reaching into the store directly)
- [ ] 9.7 Handle `after12checkedTrackers` semantics (mode 1 = noop; mode 2 = `router.push('/earth')` after `correctSoundDuration`; mode 3 = show `<Celebration>` for ~1800ms then navigate to next uncompleted game after ~4500ms)
- [ ] 9.8 Implement next-uncompleted-game search (port `GameActivity.java:356–412`) as a helper `findNextUncompletedGame(gameList, fromGameNumber, progress, playerId)` inside the feature
- [ ] 9.9 Wire `useAppState` to pause audio on `'background'` (`useAudio().pauseAll()`) and resume on `'active'`
- [ ] 9.10 Wire Android hardware-back to `router.back()`; expose `confirmOnBack?: boolean` prop for mechanics that need it (none in v1, but future mechanics with in-flight state will)
- [ ] 9.11 Implement `<GameShellScreen>` presenter — pure props → JSX; composes `<ScoreBar>` + `children` slot + bottom row (home, instructions, audio-replay, advance arrow)
- [ ] 9.12 Container passes all strings through `useTranslation()` (`chrome:score`, `chrome:back`, `chrome:replay`, `chrome:instructions`, `game:<doorNumber>.instruction`)
- [ ] 9.13 Confirm `GameShellScreen` has zero hook imports and zero i18n imports
- [ ] 9.14 Confirm `GameShellContainer` does not import anything under `type:ui` directly except through the presenter
- [ ] 9.15 Manual smoke in a sandbox: mount `<GameShellContainer>` with a no-op children slot; verify score updates, tracker icons flip, celebration triggers at `trackerCount === 12`
- [ ] 9.16 No automated tests for this lib per ADR-010 `type:feature` row

## 10. Integration wiring

- [ ] 10.1 Export every new lib from its `src/index.ts`
- [ ] 10.2 Confirm `nx graph` shows `feature-game-shell` depending only on the libs listed in design.md D9
- [ ] 10.3 Confirm `nx lint` passes on every new lib (enforce-module-boundaries)
- [ ] 10.4 Confirm `npx tsc --noEmit` passes workspace-wide
- [ ] 10.5 Add a short `libs/alphaTiles/feature-game-shell/README.md` explaining that concrete game features use it as a children-slot wrapper and should not re-implement score/tracker/audio plumbing
- [ ] 10.6 Run `openspec validate game-engine-base --strict` and resolve any findings
