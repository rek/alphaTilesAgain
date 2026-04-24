## Context

The Android original packs every shared game behavior into `GameActivity.java` — a 1200-line abstract `AppCompatActivity` subclass. All 17 concrete game classes (`Brazil`, `China`, `Chile`, …) `extends GameActivity` and only override the mechanic-specific hooks (`onCreate`, distractor picking, answer-check). Everything else — score display, tracker progression, audio playback ordering, back navigation, RTL flipping, stage word/tile selection, celebration screen, player-pref persistence — is inherited.

A direct 1-to-1 port of that class to a single React component would be unwieldy and would violate the port's architectural rules: state split between Context (boot-immutable) and Zustand (mutable); pure logic separated from components; `type:ui` libraries free of i18n and data-access coupling; container/presenter split per feature.

This change therefore decomposes `GameActivity.java` along those seams: pure-logic slivers (scoring, stage selection, phoneme parsing) become `type:util` libs; persistence becomes a `type:data-access` Zustand store; the shared UI-chrome (score bar, tile visual, board layout, celebration) becomes `type:ui` libs; the orchestrating container-plus-presenter pair (`<GameShellContainer>` + `<GameShellScreen>`) lands in a `type:feature` lib. Every concrete game feature (`feature-game-china`, and 16 future siblings) imports the shell and slots its mechanic into the shell's `children` prop.

The exact java-method-to-ts-artifact mapping is written out in D1 below so nothing is silently dropped.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §3 (library taxonomy), §6 (runtime data flow), §7 (state management — Context vs Zustand), §8 (audio), §11 (container/presenter split), §13 (routing), §14 (game taxonomy).
- `docs/decisions/ADR-004-state-management-hybrid.md`, `ADR-005-persistence-zustand-persist-asyncstorage.md`, `ADR-007-audio-expo-audio.md`, `ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `audio-system`, `theme-fonts`, `i18n-foundation`, `analytics-abstraction`, `lang-assets-runtime`, `port-foundations` (util-precompute).
  - Read each of those changes' `design.md` in full (this is the largest engine change; all six upstream contracts matter).
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/GameActivity.java` (~1217 LOC) — the abstract base being decomposed.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — for `parseWordIntoTiles` + `parseWordIntoTilesPreliminary` (ported to `util-phoneme`) and `langInfoList.find("Script direction …")`.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Util.java` — shared helpers (player-string-to-append, etc.).
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/China.java`, `Brazil.java`, `Chile.java` — three representative concrete games used as cross-checks for the shell's contract shape.
  - `../AlphaTiles/app/src/main/res/layout/activity_game.xml` — layout reference for score-bar + board.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_gametiles.txt`, `aa_wordlist.txt`, `aa_syllables.txt` — stage / phoneme data.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_games.txt` — game entries (for `country`, `challengeLevel`, `syllableGame`, `stage` columns).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt` — `"after12checkedTrackers"` setting + related.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_langinfo.txt` — `"Script direction (LTR or RTL)"`.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` — diacritics parity fixture (exercises `parseWordIntoTiles` on multi-grapheme tiles).

## Goals / Non-Goals

**Goals:**

- Every shared behavior currently in `GameActivity.java` has a known home in the port — either in the shell container, a util lib, the progress store, a ui lib, or an explicit "not ported" note with reasoning.
- A concrete game (the next change, `game-china`) can be written as a small container/presenter pair that does nothing the shell already does.
- Pure logic (scoring, stages, phoneme parsing) is unit-testable without mounting React.
- UI libs (`ui-tile`, `ui-game-board`, `ui-score-bar`, `ui-celebration`) accept pre-translated props and are documentable via Storybook.
- `<GameShellContainer>` enforces the `NO_TRACKER_COUNTRIES` guard (Romania, Sudan, Malaysia, Iraq) — those games never increment trackers regardless of what their mechanic reports.
- Celebration triggers at `trackerCount % 12 === 0` under the `after12checkedTrackers === 3` setting (bundled Lottie JSON plays; then navigate to the next uncompleted game after ~4.5s, mirroring the Java timing).
- Stage progression mirrors Android: if the assigned stage has no words, ratchet down to the highest stage with words.
- `util-phoneme`'s default parser handles the three packs exercised in v1 (`eng`, `tpx`, `yue` stub). The registry is the extension seam for future Thai / Lao / Khmer / Arabic / Devanagari / Chinese parsers.

**Non-Goals:**

- Porting `Testing.tempSoundPoolSwitch` — it is an Android-only dev toggle between `MediaPlayer` and `SoundPool`; our audio runs through `expo-audio` (ADR-007) with a single code path.
- Porting the Thai / Lao / Khmer / Arabic parsers — the registry exists; concrete parsers ship with their pack's change.
- Writing a concrete game mechanic — `game-china` is the next change.
- Porting `Earth` (game-menu) — separate change.

## Decisions

### D1. Java surface → TS artifact mapping (GameActivity.java, 1217 lines)

Every non-trivial method / field in `GameActivity.java` has an explicit destination. Private helpers too small to list (one-line getters, trivial setters) follow the pattern of their containing method.

| Java symbol | TS destination | Notes |
|---|---|---|
| `abstract class GameActivity extends AppCompatActivity` | `feature-game-shell/src/GameShellContainer.tsx` + `GameShellScreen.tsx` | container/presenter split |
| `protected abstract int[] getGameButtons()` | `<GameShellScreen>` `children` prop | each mechanic renders its own board via `ui-game-board` |
| `protected abstract int[] getWordImages()` | `children` prop | same — mechanics own their image layout |
| `protected abstract int getAudioInstructionsResID()` | `useInstructionsAudio()` hook in mechanic | resolves against `LangAssets.audio.instructions` |
| `protected abstract void hideInstructionAudioImage()` | `showInstructionsButton: boolean` prop on `<GameShellScreen>` | prop rather than imperative hide |
| `Context context` | N/A — not needed in RN | |
| `MediaPlayer mp3` | N/A — handled by `data-audio` (ADR-007) | |
| `String className`, `country`, `syllableGame`, `int challengeLevel`, `stage`, `gameNumber`, `playerNumber` | `GameShellProps` + `activeGameStore` | passed to shell + mirrored in store for selectors |
| `String scriptDirection = Start.langInfoList.find("Script direction (LTR or RTL)")` | `useLangInfo().scriptDirection` | read from `LangAssetsProvider` |
| `SharedPreferences prefs` | `data-progress` Zustand store with `persist` / AsyncStorage (ADR-004, ADR-005) | |
| `String uniqueGameLevelPlayerModeStageID` | `buildGameUniqueId({country, challengeLevel, playerId, syllableGame, stage})` in `data-progress` | exact same shape as Java |
| `boolean hasChecked12Trackers`, `int points`, `globalPoints`, `int trackerCount` | `data-progress` store fields | `checked12Trackers` renamed camelCase |
| `char studentGrade`, `long levelBegunTime`, `int incorrectOnLevel`, `ArrayList<String> incorrectAnswersSelected` | `activeGameStore` (in-flight, not persisted) | consumed by analytics; not user-visible |
| `Start.TileList cumulativeStageBasedTileList`, `previousStagesTileList`, `WordList` equivalents | memoized selectors over `util-stages` output | computed once on mount via `useMemo(stage)` |
| `ArrayList<Start.Tile> parsedRefWordTileArray`, `parsedRefWordSyllableArray` | mechanic-local `useMemo` over `util-phoneme.parseWordIntoTiles` | |
| `int visibleGameButtons` | prop on `<GameShellScreen>` (advisory for layout) | |
| `Start.Word refWord` | mechanic-local state (`useState`) | |
| `Queue<String> lastXWords` | mechanic-local `useRef<string[]>` (in-flight only) | |
| `boolean mediaPlayerIsPlaying` | derived from `useAudio().isPlaying` in shell | |
| `boolean repeatLocked` | mechanic-local `useState` | shell exposes setter |
| `Handler soundSequencer` | `setTimeout` wrapped in `useAudio()` sequencer; cleared on unmount | |
| `protected static final int[] TRACKERS = {…}` | array of 12 rendered inside `<ScoreBar>` | |
| `protected void testParsingAndCombining()` | __not ported__ — Java dev probe | commented in design only |
| `onCreate(Bundle state)` | `<GameShellContainer>` + a `useMountEffect` | reads route params via `expo-router`; dispatches to store; no `setContentView` needed (RN) |
| `OnBackPressedCallback back` → `goBackToEarth(null)` | `expo-router` `router.back()` bound via `useFocusEffect` + Android hardware-back listener | optional confirm-on-back per mechanic (prop) |
| `onPostCreate(…)` → `setAdvanceArrowToBlue()` | derived state in `<GameShellScreen>` — arrow blue when `!changeArrowColor \|\| !repeatLocked` | |
| `goBackToEarth(View)` | `router.push('/earth')` | |
| `goBackToChoosePlayer(View)` | `router.push('/choose-player')` | |
| `goToAboutPage(View)` | `router.push('/about')` | |
| `updatePointsAndTrackers(int pointsIncrease)` | `useProgress().incrementPointsAndTracker(delta)` + derived `<ScoreBar>` re-render | 3 `after12checkedTrackers` branches preserved: <br>1 = keep playing <br>2 = schedule return-to-earth after `correctSoundDuration` ms <br>3 = show `<Celebration>` for ~1.8s then navigate to next uncompleted game ~4.5s later (matches Java `Timer.schedule(…, 4500)`) |
| `NO_TRACKER_COUNTRIES` guard (implicit — `Romania`, `Sudan`, `Malaysia`, `Iraq` all skip `updatePointsAndTrackers`) | `util-scoring.shouldIncrementTracker(country)` returns `false` for these four | single source of truth |
| `chooseWord()` — stage-ratchet + correspondence-weighting + lastXWords avoidance | `util-stages.selectWordForStage(stage, wordStagesLists, previouslyShown, correspondenceRatio)` | pure; unit-tested |
| `setAllGameButtonsUnclickable/Clickable`, `setOptionsRowUn/Clickable` | `interactionLocked: boolean` state in shell; passed through `<GameShellScreen>` to children as prop | |
| `setAdvanceArrowToBlue/Gray` | derived from `repeatLocked` state + `Start.changeArrowColor` setting | |
| `clickPicHearAudio(View)` | `onPressPicture` handler in mechanic; calls `useAudio().playWord(refWord)` | |
| `playActiveWordClip(*)`, `playActiveWordClip0/1` | `useAudio().playWord(word, { onComplete })` | single code path (ADR-007); no `tempSoundPoolSwitch` |
| `playCorrectSoundThenActiveWordClip*` | `useAudio().playCorrectThenWord(word)` | |
| `playIncorrectSound*` | `useAudio().playIncorrect()` | |
| `playCorrectFinalSound*` | `useAudio().playCorrectFinal()` | |
| `playAudioInstructions(View)` | shell-provided button → `useAudio().playInstruction(instructionAudioName)` | |
| `tileAudioPress(playFinalSound, Tile)`, `isReadyToPlayTileAudio`, `tileShouldPlayAudio`, `tileAudioNumber`, `playTileAudio*`, `playTileAudioMediaPlayer`, `playTileAudioSoundPool` | `useAudio().playTile(tile, { playFinalSound })` | single code path |
| `mpCompletion(mp, isFinal)` | `onComplete` callback passed to `playWord`/`playTile` | |
| `forceRTLIfSupported`, `forceLTRIfSupported` | N/A — handled at Expo entry by `port-foundations` (`I18nManager.forceRTL` in `app/_layout.tsx`) | |
| `fixConstraintsRTL(int gameID)` | N/A — RN uses logical `marginStart`/`marginEnd` (`docs/ARCHITECTURE.md §16`) | |
| `combineTilesToMakeWord(tiles, word, indexOfReplacedTile)` (static, 952–1064) | `util-phoneme.combineTilesToMakeWord(tiles, word, indexOfReplacedTile, scriptType)` | pure; unit-tested |
| `stackInProperSequence(assembled, word)` (1066–1103) | `util-phoneme.stackInProperSequence` | pure helper for the above |
| `generateProhibitedCharSequences(word)` (1105–1209) | `util-phoneme.generateProhibitedCharSequences` | pure helper |
| `wordInLOPWithStandardizedSequenceOfCharacters(word)` (1211) | `util-phoneme.standardizeWordSequence(word, scriptType)` | pure |

Methods covered above: all public/protected methods in `GameActivity.java`. `Celebration.java` maps to `ui-celebration`; `TileAdapter.java` → `ui-tile` (ColorTile props directly ported); `ActivityLayouts.java` → not ported (RN `SafeAreaView` + `StatusBar` from `expo-status-bar` handle edge-to-edge + status-bar colors natively, with theme wiring done by the `theme-fonts` change).

### D2. `<GameShellContainer>` — container/presenter split

**Container** (`GameShellContainer.tsx`) — owns:

- Route-param extraction (`useLocalSearchParams` from `expo-router`): `gameNumber`, `challengeLevel`, `stage`, `syllableGame`, `country`, `playerId`.
- `useProgress()` — read/write persistent progress keyed by `gameUniqueId`.
- `useActiveGameStore()` — in-flight score / tracker / incorrectOnLevel.
- `useAudio()` — audio-replay, correct/incorrect/final sounds.
- `useTranslation()` — all `t('chrome:…')` + `t('game:…')` calls.
- `useLangInfo()` — `scriptDirection`, `scriptType`.
- `useAppState()` — pause audio when app backgrounded (AppState `'background'` listener).
- Android hardware-back + header-back → optional confirm dialog.
- Celebration trigger: when `trackerCount` crosses a multiple of 12 and `after12checkedTrackers === 3`, mount `<Celebration>` for `~1800ms` then `router.push` to the next uncompleted game. Timers cleared on unmount.

**Presenter** (`GameShellScreen.tsx`) — pure props → JSX:

- Renders `<ScoreBar>` at top.
- Renders `children` (the mechanic-specific board) in the middle.
- Renders audio-replay button, instructions button (if `showInstructionsButton`), back button, advance arrow at bottom.
- Zero hooks, zero data-access imports, zero `useTranslation`.

**Shell props** (container → presenter):

```ts
type GameShellScreenProps = {
  score: number;
  gameNumber: number;
  challengeLevel: number;
  trackerCount: number;
  trackerStates: ('complete' | 'incomplete')[]; // always length 12
  interactionLocked: boolean;
  showInstructionsButton: boolean;
  advanceArrow: 'blue' | 'gray' | 'hidden';
  // Pre-translated strings
  backLabel: string;
  replayLabel: string;
  instructionsLabel: string;
  scoreLabel: string;
  // Handlers
  onBackPress: () => void;
  onReplayPress: () => void;
  onInstructionsPress: () => void;
  onAdvancePress: () => void;
  // Slot
  children: React.ReactNode;
};
```

### D3. `util-scoring` — pure scoring primitives

```ts
export const NO_TRACKER_COUNTRIES = ['Romania', 'Sudan', 'Malaysia', 'Iraq'] as const;
export type NoTrackerCountry = typeof NO_TRACKER_COUNTRIES[number];

export function shouldIncrementTracker(country: string): boolean;
// returns !NO_TRACKER_COUNTRIES.includes(country)

export function addPoint(current: number, delta: number): number;
// current + delta, clamped to non-negative

export function computeTrackerCount(previous: number, isCorrect: boolean, country: string): number;
// increments when isCorrect && shouldIncrementTracker(country); else returns previous

export function isGameMastered(trackerCount: number, checked12Trackers: boolean, after12CheckedTrackers: 1 | 2 | 3): boolean;
// true when trackerCount >= 12 && (after12 === 2 || after12 === 3 || checked12Trackers)

export function pointsForStage(stage: number, isCorrect: boolean): number;
// v1: +1 per correct regardless of stage, matching GameActivity.updatePointsAndTrackers caller sites.
// Stage-scaled scoring is future work — signature is stable.
```

### D4. `util-stages` — pure stage logic

```ts
export function tileStagesLists(
  tileList: Tile[],
  stageOfFirstAppearance: (tile: Tile) => number,
): Tile[][]; // length 7, each index is the tiles newly added at that stage

export function wordStagesLists(
  wordList: Word[],
  tileStages: Tile[][],
  parseWordIntoTiles: (word: Word) => Tile[],
  correspondenceRatio: number,
): Word[][]; // length 7, mirrors Start.buildWordStagesLists

export function computeStageCorrespondence(
  word: Word,
  stageTiles: Tile[],
  parseWordIntoTiles: (word: Word) => Tile[],
): number; // 0..1 — fraction of word tiles present in stageTiles

export function selectWordForStage(opts: {
  stage: number;
  wordStagesLists: Word[][];
  previousStagesWordList: Word[];
  cumulativeStageBasedWordList: Word[];
  previouslyShown: string[]; // wordInLOP values
  correspondenceRatio: number;
  rng?: () => number;        // injected for tests
}): Word; // ports GameActivity.chooseWord — stage-ratchet + weighted-correspondence + lastXWords avoidance
```

Default `correspondenceRatio = 0.5` when `aa_settings.txt` omits it (matches `Start.java` line 147). The global `stageCorrespondenceRatio` is read once from `aa_settings.txt` by `lang-assets-runtime` and passed into this library; the library never reads settings itself.

### D5. `util-phoneme` — parser registry

> **Note:** `libs/shared/util-phoneme` (`scope:shared`) was pre-built by the `lang-pack-validator` change and already exports `parseWordIntoTiles`, `parseWordIntoTilesPreliminary`, and `buildTileHashMap`. This change **extends** that existing lib — no new lib scaffold needed. The scope stays `shared` (the runtime engine and the validator both consume it).

New additions to `libs/shared/util-phoneme`:

```ts
type ScriptType = 'default' | 'Thai' | 'Lao' | 'Khmer' | 'Arabic' | string;

type ScriptParser = {
  parse: (word: string, tileList: Tile[], referenceWord: Word) => Tile[];
  combine: (tiles: Tile[], word: Word, indexOfReplacedTile: number) => string;
  standardizeSequence: (word: Word) => string;
};

export function registerScriptParser(scriptType: string, parser: ScriptParser): void;
// throws if scriptType already registered (mirrors util-precompute's duplicate-key rule)

export function combineTilesToMakeWord(tiles: Tile[], word: Word, indexOfReplacedTile: number, scriptType: ScriptType): string;
export function standardizeWordSequence(word: Word, scriptType: ScriptType): string;

// parseWordIntoTiles already exported — gains optional scriptType dispatch via registry.
// Default parser (built-in, registered as 'default' at module load):
// - Unidirectional left-to-right greedy match against tileList (longest-first).
// - No multi-pass reordering (that is the RTL/LTR-swap concern of Thai/Lao/Khmer/Arabic, future work).
```

**Extension seam** (documented, not implemented):

```ts
// At feature-lang-thai/src/index.ts (future, when a Thai pack lands):
registerScriptParser('Thai', {
  parse:  (w, tiles, ref) => { /* left-vowel-reorder per Start.java 1489–1687 */ },
  combine: (tiles, w, idx) => { /* reverse-pass stackInProperSequence */ },
  standardizeSequence: (w) => { /* per Start.java 1211 */ },
});
```

`util-phoneme` stays a pure util lib; Thai/Lao/Khmer/Arabic parsers are their own future libs that import-and-register at module-top-level, the same pattern as `util-precompute` (`docs/ARCHITECTURE.md §9`).

### D6. `data-progress` — Zustand progress store

```ts
type ProgressKey = string; // uniqueGameLevelPlayerModeStageID

type ProgressEntry = {
  points: number;
  trackerCount: number;
  checked12Trackers: boolean;
  lastPlayed: number; // epoch ms
};

type ProgressStore = {
  progress: Record<ProgressKey, ProgressEntry>;
  incrementPoints: (key: ProgressKey, delta: number) => void;
  incrementTracker: (key: ProgressKey) => void;
  markChecked12: (key: ProgressKey) => void;
  resetGame: (key: ProgressKey) => void;
};

export function buildGameUniqueId(opts: {
  country: string;
  challengeLevel: number;
  playerId: string;
  syllableGame: string | '';
  stage: number;
}): ProgressKey;
// matches Java: className + challengeLevel + playerString + syllableGame + stage
// but uses country (= className without the `org.alphatilesapps.alphatiles.` prefix) for portability
```

Persisted via Zustand `persist` + AsyncStorage (ADR-005). One store, one persist config. No migration code in v1 (ADR-005 `no migration code in v1`).

### D7. Celebration — Lottie animation + navigation timing

- Single content-neutral confetti JSON at `apps/alphaTiles/assets/lottie/celebration.json` (checked in; not pack-specific).
- `<Celebration>` from `libs/shared/ui-celebration` renders a full-screen `LottieView autoPlay loop={false}` + a "back to earth" button (analogous to Java Celebration's `zz_games_home` image).
- Disables hardware back while animating (matches Java `OnBackPressedCallback { intentionally empty }` at line 25–30).
- Plays `gameSounds.play(correctFinalSoundID, …)` via `useAudio().playCorrectFinal()` on mount.
- Java timing:
  - Java schedules `Celebration` after `correctSoundDuration + 1800` ms.
  - Java schedules next-uncompleted-game after `4500` ms total.
- Port preserves both timings. `<GameShellContainer>` owns the `setTimeout`s and clears them on unmount.

### D8. `ui-score-bar` — composition matching `china.xml` guideline row

Android's score row (at the top of every concrete game's XML) is: `[gameNumber][challengeLevel][tracker01…tracker12][scoreText]`. Width allocation via ConstraintLayout guidelines. Port collapses that into `<ScoreBar>`:

```tsx
<ScoreBar
  gameNumber={gameNumber}
  gameColor={gameColor}               // resolved via useColors(gameList[i].color)
  challengeLevel={displayedChallengeLevel}
  trackerStates={trackerStates}       // length 12
  score={score}
  scoreLabel={scoreLabel}             // pre-translated
/>
```

`displayedChallengeLevel` logic for Thailand / Brazil / Georgia (lines 261–274 of `GameActivity`) moves into the container that renders `<ScoreBar>`: a `displayChallengeLevel(country, challengeLevel)` util inside `util-scoring`. (It's about display, not scoring, but it's pure and small; lumping it into a sibling util is not worth a new lib.)

### D9. NX tags + dependency graph

| Lib | type | scope | May import |
|---|---|---|---|
| `libs/alphaTiles/feature-game-shell` | `type:feature` | `scope:alphaTiles` | ui-tile, ui-game-board, ui-celebration, ui-score-bar, data-progress, data-audio, data-language-assets, util-scoring, util-stages, util-phoneme, util-precompute, util-i18n, util-theme, util-analytics, expo-router, react-native, lottie-react-native |
| `libs/alphaTiles/util-scoring` | `type:util` | `scope:alphaTiles` | nothing (pure) |
| `libs/alphaTiles/util-stages` | `type:util` | `scope:alphaTiles` | nothing (pure) — parseWordIntoTiles injected as param |
| `libs/shared/util-phoneme` | `type:util` | `scope:shared` | nothing (pure) — pre-built by lang-pack-validator; extended here |
| `libs/alphaTiles/data-progress` | `type:data-access` | `scope:alphaTiles` | zustand, @react-native-async-storage/async-storage, util-scoring (for key builder only) |
| `libs/shared/ui-tile` | `type:ui` | `scope:shared` | react-native, util-theme (shared) — never i18n |
| `libs/shared/ui-game-board` | `type:ui` | `scope:shared` | react-native, util-theme |
| `libs/shared/ui-celebration` | `type:ui` | `scope:shared` | react-native, lottie-react-native |
| `libs/shared/ui-score-bar` | `type:ui` | `scope:shared` | react-native, util-theme, ui-tile-like primitives if any are extracted |

Every `ui-*` lib is i18n-blind per `docs/ARCHITECTURE.md §10`. Strings come in as props.

### D10. Testing strategy (per ADR-010)

| Lib | Tests |
|---|---|
| `util-scoring` | Jest unit: `shouldIncrementTracker`, `computeTrackerCount`, `isGameMastered`, `pointsForStage`, `displayChallengeLevel` |
| `util-stages` | Jest unit: `tileStagesLists`, `wordStagesLists`, `computeStageCorrespondence`, `selectWordForStage` (with seeded RNG; fixture = `languages/eng/` parsed into structures) |
| `util-phoneme` | Jest unit: default parser round-trips every word in `languages/eng/` and `languages/tpx/` (parse → combine === standardized); `registerScriptParser` duplicate-key throws |
| `data-progress` | Jest unit: key builder matches Java string, `incrementPoints`/`incrementTracker` semantics, persist/rehydrate via AsyncStorage mock |
| `feature-game-shell` | No automated tests in v1 (per ADR-010 `type:feature` row) — manual QA |
| `ui-tile`, `ui-game-board`, `ui-score-bar`, `ui-celebration` | Storybook stories; no mandatory unit tests |

## Risks / Trade-offs

### R1. `GameActivity.java` is our single biggest single-class port

1217 lines, ~40 methods, 3 hours of reading to understand. Mitigation: D1 above is the literal line-by-line map. Any slip-through surfaces in `game-china` implementation (the next change), because China is a thin mechanic — anything structural it needs and the shell doesn't provide will be obvious immediately.

### R2. Container in a `type:feature` lib imports 9 other libs

`feature-game-shell` has an unusually wide import surface for a feature lib. This is because it's not a normal screen — it's the base-class equivalent. Alternative would be to make each concrete game re-do the wiring, but that defeats the point of the port. Accept the width; policing is still via ESLint `enforce-module-boundaries` (the types it imports are all valid).

### R3. Celebration timing magic numbers (`1800`, `4500`)

Ported verbatim from Java. Neither is explained in the source. Decision: preserve as constants in `feature-game-shell` with a comment citing `GameActivity.java:342, 412`. If the port team later decides the animation should be tighter on modern devices, that's a follow-up tuning.

### R4. `after12checkedTrackers` modes 1 / 2 / 3

Setting is an integer 1|2|3 in `aa_settings.txt` (default 3 per `Start.java:135`). Port reads it from `lang-assets-runtime`; `util-scoring.isGameMastered` takes it as a param; `<GameShellContainer>` branches on it. Kept as a numeric enum rather than a string enum to match the pack-file shape exactly.

### R5. Per-language script-type parser registry

`util-phoneme` ships only the default parser in this change. If a pack with `Script type = Thai` is built before the Thai parser lands, `parseWordIntoTiles` will fall back to default and produce wrong tile parsing. Guardrail: `parseWordIntoTiles` logs a warning when `scriptType !== 'default'` and no parser is registered for it. The `lang-pack-validator` change can escalate that to a build-time failure for Thai/Lao/Khmer/Arabic packs (future work, not blocking).

### R6. Lottie dep

`lottie-react-native` is a new runtime dep. Weight: ~180KB JS. Alternatives considered: a CSS-animated `<View>` confetti, `react-native-reanimated` particle system. Lottie chosen because (a) one shared JSON animation is cheap to maintain, (b) designers can tweak the animation without touching code, (c) Lottie works on web, iOS, Android with one API. Documented in `ADR-010` follow-ups / `docs/decisions/ADR-011-celebration-animation-lottie.md` (to add when/if a formal ADR is warranted; for now this design.md note suffices).

## Migration Plan

This is an additive change — no libs are replaced, no runtime behavior is in place yet for these surfaces. The only prior-work dep is `port-foundations` (must have landed), `lang-assets-runtime` (must have landed), `audio-system`, `i18n-foundation`, `analytics-abstraction`, `theme-fonts`, `player-profiles`. Tasks in `tasks.md` assume those are in place.

No existing user data to migrate (no shipped app yet). `data-progress` starts empty in every fresh install.

## Open Questions

_None blocking this change._ Noted for the follow-up implementation:

- Exact Lottie JSON — designer deliverable; placeholder commits can use `lottie-react-native`'s sample until the real one arrives.
- Whether `displayChallengeLevel` lives in `util-scoring` (proposed) or a new tiny `util-game-display` — negligible; lumping keeps lib count down.
- Whether `util-stages.selectWordForStage` accepts a `differentiatesTileTypes` flag (Java `Start.java:452`). Lang packs we ship in v1 all set it false; decision: omit for v1, add as optional param when the first pack with `differentiatesTileTypes = true` lands.
