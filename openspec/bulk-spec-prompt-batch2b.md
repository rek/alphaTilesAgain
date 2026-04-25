# Bulk Spec Prompt — Batch 2B (UX + Feature Changes)

You are writing OpenSpec change artifacts for an Expo + React Native + TypeScript NX monorepo.

## Project summary

**AlphaTiles** — literacy game generator for minority-language communities. A language community supplies a folder of assets (tab-delimited wordlists, phoneme/tile data, audio, images, fonts) and the app renders that as tile-based literacy games in that language.

This is a port of a Java/Android app. The app already has the core game engine, 17 game mechanics, progress tracking, analytics abstraction, and a working Expo shell. Batch 2B specs cover UX and feature additions: end-of-game flows, progress visualization, RTL, onboarding, haptics, custom celebrations, authoring CLI, sharing, stats, and font scaling.

The spec artifacts are **not code** — they are design documents + task checklists that a developer (or coding agent) will later use to write the code.

---

## Architecture rules (non-negotiable)

- **Library pattern**: `libs/{scope}/{type}-{name}` (scope: `alphaTiles` | `shared`)
- **Types**: `type:feature`, `type:data-access`, `type:ui`, `type:util`
- **Dependency rules**: `feature` → `ui/data-access/util`, `data-access` → `util`, `ui` → `util`, `util` → nothing
- **Container/Presenter split**: every feature screen has a container (`<XxxContainer>`) that owns hooks + state + callbacks, and a presenter (`<XxxScreen>`) that is pure props → JSX with no hooks.
- **i18n-blind presenters**: presenters never import `react-i18next`. All translated strings are passed as props from the container.
- **No barrel files** except library root `src/index.ts`. One function/component per file.
- **Routes**: `apps/alphaTiles/app/<path>.tsx` renders a container.
- **No separate type files** — infer with `ReturnType`, `Parameters`, `typeof`.
- **No direct `useEffect`** — use derived state, handlers, `useMountEffect`, or `key`.

---

## Shell API (what every feature gets)

```ts
// Game containers:
const { challengeLevel, syllableGame, stage, gameNumber, country } = useGameShell();
const { tiles, words, syllables, colors, settings, langInfo, audio } = useLangAssets();
const { incrementPointsAndTracker } = useProgress();

// useLangAssets() returns:
// {
//   tiles, words, syllables,
//   langInfo: { scriptDirection: 'LTR' | 'RTL', ... },
//   settings, colors, audio,
//   ...
// }
```

**Progress store** (`data-progress`):

```ts
type ProgressKey = string; // buildGameUniqueId({ country, challengeLevel, playerId, syllableGame, stage })
type ProgressEntry = {
  points: number;
  trackerCount: number;
  checked12Trackers: boolean;
  lastPlayed: number; // epoch ms
};
// Store: Record<ProgressKey, ProgressEntry>
// Hooks: useProgressStore(), useProgressEntry(key), useTotalPoints()
```

**Analytics abstraction** (`shared/util-analytics`):

```ts
type AnalyticsAdapter = {
  track(event: string, props?: Record<string, unknown>): void;
  identify(playerId: string, traits?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
};
// Current default: no-op adapter. Real adapters registered via setAnalyticsAdapter(impl).
// Also: track(), identify(), screen(), setAnalyticsEnabled(), useTrackScreenMount()
```

**Theme** (`shared/util-theme`):

```ts
// buildTheme(palette, fontMap) returns:
// { palette, colors: { primary, background, text }, typography, spacing, fontFamily }

// typography (currently fixed values — Batch 2B change font-scaling-accessibility will add fontScale):
const typography = {
  xs:  { fontSize: 12, lineHeight: 16 },
  sm:  { fontSize: 14, lineHeight: 20 },
  md:  { fontSize: 16, lineHeight: 24 },
  lg:  { fontSize: 20, lineHeight: 28 },
  xl:  { fontSize: 28, lineHeight: 36 },
  '2xl': { fontSize: 40, lineHeight: 48 },
};
// NOTE: ~30 components currently hardcode fontSize instead of using theme.typography.
```

---

## Output format

For each of the 10 changes, output **5 files** with this exact delimiter format:

```
=== FILE: openspec/changes/<name>/proposal.md ===
...content...

=== FILE: openspec/changes/<name>/design.md ===
...content...

=== FILE: openspec/changes/<name>/tasks.md ===
...content...

=== FILE: openspec/changes/<name>/specs/<name>/spec.md ===
...content...

=== FILE: openspec/changes/<name>/.openspec.yaml ===
...content...
```

Process all 10 changes in order. The 10 names are listed at the end.

---

## Complete example: game-end-screen (all 5 artifacts)

Study these carefully — they define the format and quality bar for UX/feature changes. Note: `game-end-screen` is itself the first change in this batch (#1 below); the worked example IS its spec. Output the 5 files verbatim from this example, adjusted only if you see improvements.

=== EXAMPLE FILE: openspec/changes/game-end-screen/proposal.md ===
## Why

When a player achieves `checked12Trackers = true` for a game door (12 tracker increments), there is currently no celebration or summary screen. The game simply returns to the menu. This change adds a full-game completion flow: a dedicated end screen showing the player's accumulated points and tracker count, a replay CTA, and navigation back to the menu.

## What Changes

- Add `libs/alphaTiles/feature-game-end-screen` — `<GameEndScreenContainer>` + `<GameEndScreen>`.
- The end screen is shown by `GameShellContainer` when `checked12Trackers` transitions from false to true after an `incrementPointsAndTracker` call.
- Displays: player avatar, game name, total points for this door, trackerCount (capped at 12), a star-fill graphic reflecting trackerCount, a "Play Again" button, and a "Menu" button.
- "Play Again" navigates back to the current game (same door/level/stage). "Menu" navigates to the menu.
- The screen reads progress from `useProgressEntry(currentKey)`.

## Capabilities

### New Capabilities

- `game-end-screen` — Full-game completion screen: shown when 12 trackers checked; displays points + tracker stars; offers replay or menu navigation.

## Impact

- **New lib**: `libs/alphaTiles/feature-game-end-screen` (`type:feature`, `scope:alphaTiles`).
- **Modified**: `libs/alphaTiles/feature-game-shell` — trigger end-screen when `checked12Trackers` first becomes true.

## Out of Scope

- Mid-game summary (partial completion screens).
- Social sharing from this screen (covered by `share-results-card` change).
- Per-phoneme breakdown (covered by `phoneme-progress-charts` change).

=== EXAMPLE FILE: openspec/changes/game-end-screen/design.md ===
## Context

`GameShellContainer` wraps every game. After `incrementPointsAndTracker` is called, the shell checks the new `ProgressEntry`. If `checked12Trackers` is now true (and was false before the call), the shell navigates to the end screen. The end screen reads the entry for the current game key and renders a summary.

### Required reading for implementers

- `docs/ARCHITECTURE.md` §3 (taxonomy), §11 (container/presenter), §13 (routing).
- `docs/decisions/ADR-010-testing-storybook-plus-unit.md`.
- **Upstream OpenSpec changes:** `game-engine-base` (merged), `analytics-abstraction` (merged).
- `libs/alphaTiles/data-progress/src/lib/useProgressStore.ts` — understand `ProgressEntry` shape.
- `libs/alphaTiles/feature-game-shell/` — understand how shell navigates today.

## Goals / Non-Goals

**Goals:**
- Render end screen when `checked12Trackers` transitions to true.
- Show points, trackerCount (stars), player avatar, game title.
- "Play Again" returns to same game. "Menu" returns to menu.
- Container/Presenter split; i18n-blind presenter.

**Non-Goals:**
- Share sheet (separate change).
- Per-phoneme detail (separate change).
- Sound/animation beyond `ui-celebration` component already in the lib.

## Decisions

### D1. Trigger mechanism

`GameShellContainer` holds a ref to the previous `checked12Trackers` value for the current key. After each `incrementPointsAndTracker`, it compares old vs new. On false→true transition, it pushes route `/(games)/end-screen` with params `{ key }`.

| Question | Decision |
|---|---|
| Push or replace? | Push — allows back button to return to game if desired. |
| Where is nav logic? | Inside `feature-game-shell` — not in individual game containers. |

### D2. Data flow

```ts
// In <GameEndScreenContainer>:
const { key } = useLocalSearchParams();
const entry = useProgressEntry(key);
// entry: { points, trackerCount, checked12Trackers, lastPlayed }
```

`trackerCount` is capped at 12 in the presenter for star display; the raw value may exceed 12.

### D3. Component/presenter split

**`<GameEndScreenContainer>`** — owns:
- `useLocalSearchParams()` to get `key`.
- `useProgressEntry(key)` to get `entry`.
- `usePlayer()` to get avatar.
- Navigation callbacks: `onReplay`, `onMenu`.
- i18n strings passed to presenter.

**`<GameEndScreen>`** — pure props → JSX:
- `points: number`, `trackerCount: number`, `avatarIndex: number`, `gameTitle: string`.
- `onReplay: () => void`, `onMenu: () => void`.
- No hooks. Renders star fill (trackerCount / 12), points badge, avatar, two CTAs.

### D4. Route

`apps/alphaTiles/app/(games)/end-screen.tsx` renders `<GameEndScreenContainer />`.

## Testing strategy

| Area | Approach |
|---|---|
| Trigger detection (false→true) | Jest unit test on shell logic |
| `<GameEndScreen>` | Storybook stories: 12/12 stars (full), 6/12 stars (partial), 0 points |
| `<GameEndScreenContainer>` | Manual QA: play game to completion, confirm end screen appears |

=== EXAMPLE FILE: openspec/changes/game-end-screen/tasks.md ===
# Tasks: Game End Screen

## 0. Preflight

- [ ] Read `proposal.md`, `design.md`, `specs/game-end-screen/spec.md`.
- [ ] Read `libs/alphaTiles/feature-game-shell/` — understand current navigation + shell container.
- [ ] Read `libs/alphaTiles/data-progress/src/lib/useProgressStore.ts`.

## 1. Library Scaffold

- [ ] Generate library: `nx g @nx/react-native:lib feature-game-end-screen --directory=libs/alphaTiles/feature-game-end-screen --tags='type:feature,scope:alphaTiles'`.
- [ ] Add path alias to `tsconfig.base.json`.
- [ ] Create route: `apps/alphaTiles/app/(games)/end-screen.tsx`. Renders `<GameEndScreenContainer />`.

## 2. Presenter: `<GameEndScreen>`

- [ ] Define `GameEndScreenProps`: `points`, `trackerCount`, `avatarIndex`, `gameTitle`, `onReplay`, `onMenu`, i18n strings.
- [ ] Implement star-fill row: `Math.min(trackerCount, 12)` filled stars out of 12.
- [ ] Storybook stories: full (12/12), half (6/12), zero (0/12, 0 points).

## 3. Container: `<GameEndScreenContainer>`

- [ ] Implement container: read `key` from params, `useProgressEntry(key)`, `usePlayer()`.
- [ ] Wire `onReplay` (router.replace to game route) and `onMenu` (router.replace to menu).
- [ ] Pass all i18n strings from `useTranslation()`.

## 4. Shell Integration

- [ ] In `feature-game-shell`: add `prevChecked12Ref` to track previous `checked12Trackers` value.
- [ ] After `incrementPointsAndTracker` resolves, compare ref to current store value. On false→true: push `/(games)/end-screen?key=<currentKey>`.
- [ ] Unit test: mock store transition, assert navigation called once.

## 5. Verification

- [ ] Type-check: `npx tsc --noEmit`.
- [ ] Lint: `nx lint alphaTiles-feature-game-end-screen`.
- [ ] Test: `nx test alphaTiles-feature-game-end-screen`.
- [ ] Manual: play a game door to 12 tracker completions; confirm end screen appears with correct points and stars.

=== EXAMPLE FILE: openspec/changes/game-end-screen/specs/game-end-screen/spec.md ===
# Capability: Game End Screen

Shown after a player checks all 12 trackers for a game door. Displays a summary and offers replay or menu navigation.

## Requirements

### R1. Trigger: 12 Trackers Checked

The end screen MUST be shown when `checked12Trackers` transitions from false to true.

#### Scenario: First time 12 trackers reached
- **GIVEN** a game with `checked12Trackers = false` and `trackerCount = 11`
- **WHEN** `incrementPointsAndTracker` is called and `trackerCount` reaches 12
- **THEN** the end screen is pushed onto the navigation stack

#### Scenario: Already checked — no re-trigger
- **GIVEN** a game where `checked12Trackers` is already true
- **WHEN** the player earns more points
- **THEN** the end screen is NOT shown again

### R2. Points and Tracker Stars

The end screen MUST display the player's total `points` and a star row showing `min(trackerCount, 12)` filled stars out of 12.

### R3. Replay CTA

Tapping "Play Again" MUST navigate back to the same game (same door, challenge level, and stage).

### R4. Menu CTA

Tapping "Menu" MUST navigate to the main menu.

### R5. Container/Presenter Split

`<GameEndScreenContainer>` SHALL own all hooks and data fetching. `<GameEndScreen>` SHALL be a pure props→JSX presenter.

=== EXAMPLE FILE: openspec/changes/game-end-screen/.openspec.yaml ===
name: game-end-screen
artifacts:
  proposal:
    status: done
    path: proposal.md
  design:
    status: done
    path: design.md
    dependencies: [proposal]
  tasks:
    status: done
    path: tasks.md
    dependencies: [design]
  specs/game-end-screen:
    status: done
    path: specs/game-end-screen/spec.md
    dependencies: [design]
apply:
  requires: [tasks, specs/game-end-screen]
  status: pending

---

## Change briefs (10 changes to spec)

Below is a brief for each of the 10 changes. Read each carefully. The brief describes what to build, key constraints, and relevant project context.

---

### 1. `game-end-screen`

(See the complete worked example above — the example IS this spec. Output the 5 files verbatim from the example, adjusted only if you see improvements.)

---

### 2. `phoneme-progress-charts`

**Brief:** Add a per-phoneme mastery view to the player profile. Currently `data-progress` tracks only per-game-key totals (`points`, `trackerCount`). This change first extends `data-progress` to record per-phoneme correct/incorrect counts (`Record<string, { correct: number; incorrect: number }>`), then adds a `feature-phoneme-progress` screen that shows a bar chart per phoneme with mastery percentage. The chart data is derived per player per game door.

**Special notes:**
- `data-progress` extension: add `phonemes?: Record<string, { correct: number; incorrect: number }>` to `ProgressEntry`. Games call a new `recordPhonemeResult(key, phonemeId, correct: boolean)` action.
- The existing `ProgressEntry` shape must remain backwards-compatible — `phonemes` is optional.
- Game containers that award points for a specific tile should pass the tile's phoneme ID; the design.md should note which games this applies to (brazil, georgia, peru at minimum).
- Chart UI: horizontal bar per phoneme, filled to `correct / (correct + incorrect)` %. Use `libs/shared/ui-*` pattern for the chart component — pure props, no hooks.
- Route: accessible from player profile screen (`feature-choose-player` or a new `feature-player-profile`).

---

### 3. `rtl-support`

**Brief:** Add right-to-left layout support for language packs where `langInfo.scriptDirection === 'RTL'` (e.g., Arabic for `game-iraq`). RTL flips the horizontal axis: flex row reverses, text aligns right, back/forward arrows swap sides. This change updates the shell chrome, game board, and keyboard layouts to respect `scriptDirection`.

**Special notes:**
- `langInfo.scriptDirection` is available from `useLangAssets()` (type: `'LTR' | 'RTL'`).
- Implementation pattern: pass `isRTL: boolean` as a prop through the component tree; do NOT use `I18nManager.forceRTL` (that requires app restart and affects the whole OS — not appropriate for a per-language-pack flag).
- Components affected: `GameShellContainer` chrome (back button, title), `ui-custom-keyboard` (key order), `ui-game-board` (tile row direction), `ui-tile` (text alignment). Each must accept and apply an `isRTL` prop.
- `game-iraq` is the primary validation target: its tile explorer grid should lay out RTL.
- Do not affect font loading or bidirectional text rendering within a single tile — React Native handles that automatically for Arabic/Hebrew characters.

---

### 4. `onboarding-tutorial`

**Brief:** Add a first-run walkthrough that guides new users through: (1) creating a player, (2) tapping a door to start a game, (3) playing one round. The tutorial is a multi-step overlay system — each step highlights a target element and shows a tooltip. After the last step, the tutorial is marked complete and never shown again (stored in `AsyncStorage`).

**Special notes:**
- Tutorial state: `{ completed: boolean, currentStep: number }` stored in `AsyncStorage` under key `'onboarding_tutorial'`.
- Steps: 3 steps minimum — (1) point to avatar/player area, (2) point to a door, (3) point to a game tile. Each step has a title, body text (i18n), and a "Next" / "Got it" button.
- Implementation: a `<TutorialOverlay>` component rendered at the root layout level, conditionally visible. Highlight targets via `measure()` on refs — not absolute coordinates.
- Skip button: always visible; marks tutorial complete immediately.
- Re-trigger: a "Replay Tutorial" option in the About/Settings screen should reset the flag.
- No deep linking or complex animation in v1 — a simple semi-transparent overlay with a spotlight cutout is sufficient.

---

### 5. `haptics-feedback`

**Brief:** Add vibration feedback on correct answers, incorrect answers, and game completion (celebration). Create `libs/shared/util-haptics` (`type:util`, `scope:shared`) which exports a `useHaptics()` hook. Haptics are off by default; the user can toggle them in settings. The hook returns `{ triggerCorrect, triggerIncorrect, triggerCelebration }` functions.

**Special notes:**
- Use `expo-haptics` (`ImpactFeedbackStyle.Light` for correct, `NotificationFeedbackType.Error` for incorrect, `ImpactFeedbackStyle.Heavy` for celebration).
- The setting `hapticsEnabled: boolean` lives in a new action on `data-players` store (player-level preference, not global) — OR in a separate `util-settings` store if one exists; design.md should decide.
- `useHaptics()` reads the setting and no-ops if disabled or if `Platform.OS === 'web'` (web has no haptics).
- Game containers call `triggerCorrect()` / `triggerIncorrect()` in the same handler that calls `playCorrect()` / `playIncorrect()`.
- `triggerCelebration()` is called by `GameShellContainer` when `checked12Trackers` transitions to true (same trigger as `game-end-screen`).

---

### 6. `custom-celebration-per-lang`

**Brief:** Allow each language pack to supply a custom celebration asset — either a Lottie animation JSON file (`celebration.lottie.json`) or an audio file (`celebration.mp3`) — that plays when a player checks all 12 trackers. If neither asset is present in the pack, the existing default celebration (`ui-celebration` component) is used. The `data-language-assets` loader should detect and expose these optional assets.

**Special notes:**
- Lottie: use `lottie-react-native`. The animation plays once on the end screen (or over the game shell on win). Lottie file lives at `<langPack>/celebration.lottie.json`.
- Audio: `celebration.mp3` lives at `<langPack>/celebration.mp3`; played via the existing `data-audio` infrastructure.
- If both exist, Lottie takes precedence (audio can play simultaneously if desired — design.md should decide).
- `useLangAssets()` should expose `{ celebrationLottie?: LottieSource; celebrationAudio?: AudioSource }` — add to the `LangAssets` type.
- The existing `ui-celebration` confetti component is the fallback and must remain untouched.

---

### 7. `content-authoring-cli`

**Brief:** Add a CLI tool (`tools/lang-pack-cli/`) that helps a language community author create, validate, and preview a new language pack. The CLI has three subcommands: `init <langCode>` (scaffold the folder structure and template files), `validate <path>` (run `util-lang-pack-validator` checks and report errors), and `preview <path>` (start the Expo dev server with `APP_LANG` pointing to the given path).

**Special notes:**
- Built with Node.js + TypeScript, run via `npx ts-node tools/lang-pack-cli/index.ts <subcommand>`.
- `validate` reuses the existing `libs/alphaTiles/util-lang-pack-validator` logic — import it directly (the validator is already a pure TS library).
- `init` generates: `aa_colors.txt` (template), `aa_keyboard.txt` (template), `wordlist.txt` (commented template), `settings.txt` (template), `fonts/` (empty dir), `images/` (empty dir), `audio/` (empty dir).
- `preview` is a thin wrapper: `APP_LANG=<resolved-path> npx nx serve alphaTiles`.
- The CLI is developer/author tooling — not shipped in the app bundle.
- Add an NX project (`tools/lang-pack-cli/project.json`) with `build` and `validate` targets.

---

### 8. `share-results-card`

**Brief:** Add a "Share" button to the game end screen (and optionally the player profile) that generates a shareable image of the player's result — avatar, game name, points, tracker stars — and invokes the native share sheet. The image is generated off-screen using `react-native-view-shot`.

**Special notes:**
- `react-native-view-shot` captures a React Native view as a PNG. The captured view (`<ResultCard>`) is rendered off-screen (position absolute, opacity 0) and then captured.
- `ResultCard` is a `type:ui` presenter component: pure props → JSX, no hooks. Props: `{ avatarIndex, gameTitle, points, trackerCount, langCode }`.
- Share invocation uses `expo-sharing` (`Sharing.shareAsync(uri)`).
- The "Share" button lives on the game end screen (added in `game-end-screen` change — this change extends that screen). If `game-end-screen` is not yet merged, note the dependency in `.openspec.yaml`.
- Web: `expo-sharing` falls back to the Web Share API — test that the image URI works on web.
- The card design should be simple: white background, avatar top-center, game title, star row, points count. Brand colors from `theme.colors.primary`.

---

### 9. `player-stats-screen`

**Brief:** Add a detailed statistics dashboard accessible from the player profile. The screen shows: total points across all games, total tracker completions, per-game-door stats (a row per unique `ProgressKey` with points and trackerCount), and last-played timestamp. Data comes from `useProgressStore()`.

**Special notes:**
- Route: `apps/alphaTiles/app/(profile)/stats.tsx` renders `<PlayerStatsContainer>`.
- `<PlayerStatsContainer>` reads `useProgressStore().progress` and filters to keys belonging to the current player (keys are built from `buildGameUniqueId` which includes `playerId`).
- `<PlayerStatsScreen>` is a pure presenter: `{ totalPoints, totalTrackers, entries: GameStatRow[], playerName }`. `GameStatRow = { gameTitle: string, points: number, trackerCount: number, lastPlayed: Date | null }`.
- Mapping `ProgressKey` → human-readable game title requires a lookup of `country` from the key — `buildGameUniqueId` encodes it; a reverse parser `parseGameUniqueId(key)` may need to be added to `data-progress`.
- Entry point: add a "Stats" button to the existing player profile / choose-player screen.

---

### 10. `font-scaling-accessibility`

**Brief:** Add a global font scale multiplier to the theme system so that all typography scales proportionally from a single root factor. Some language packs need larger glyphs (e.g., Chinese scripts), and users with accessibility needs may want larger text. The change adds a `fontScale` parameter to `buildTheme`, produces scaled typography values, and allows the lang pack to specify a default `fontScale` in its settings.

**Special notes:**

**Important — scope and approach:**

- `util-theme/typography.ts` currently has 6 fixed size keys (`xs`→`2xl`). `buildTheme` returns these values unchanged.
- **Step 1 (theme):** Add optional `fontScale: number` (default `1.0`) to `buildTheme`'s signature. Compute `scaledTypography` by multiplying each `fontSize` and `lineHeight` by `fontScale`. `buildTheme` returns `scaledTypography` instead of the raw `typography` constant.
- **Step 2 (lang pack):** `settings.txt` may contain a `Font Scale` key (float, e.g., `1.2`). `util-lang-pack-parser` should parse it; `useLangAssets()` should pass it to `buildTheme`.
- **Step 3 (component audit):** ~30 components currently hardcode `fontSize` instead of using `theme.typography.*`. The design.md must enumerate these (or describe a grep strategy) and tasks.md must include a checkbox to migrate each one. Use `theme.typography.md.fontSize` etc., not raw numbers.
- **Tile text vs UI chrome:** tile text (`2xl`, `xl`) must remain larger than UI chrome (`sm`, `xs`) regardless of scale — this is preserved automatically if all sizes scale by the same factor.
- **User setting:** optionally expose a font scale slider (1.0–1.5) in an accessibility settings screen; the design.md should decide whether this is in v1 or deferred.
- **Test:** `buildTheme` unit test verifies that `fontScale: 1.5` produces `typography.md.fontSize === 24` (16 × 1.5).

---

## Your task

Generate the 5 OpenSpec artifacts for each of the 10 changes listed above.

**Process in this order:**
game-end-screen, phoneme-progress-charts, rtl-support, onboarding-tutorial, haptics-feedback, custom-celebration-per-lang, content-authoring-cli, share-results-card, player-stats-screen, font-scaling-accessibility

---

**Guidelines for each change:**

1. **proposal.md**: 1–2 paragraphs. What the change is, what new libs/routes are added, what existing libs are modified. Under 300 words.

2. **design.md**: The substantive spec. Must include:
   - Context section (what problem is solved, required reading, upstream dependencies)
   - Goals / Non-Goals
   - Decisions section (D1, D2, …) for key design choices, with tables where appropriate
   - Testing strategy table

3. **tasks.md**: Numbered checklist. Always has: `0. Preflight`, `1. Library/Infra Scaffold`, intermediate sections for logic/UI/integration, final `N. Verification`. Adjust sections as needed.

4. **specs/<name>/spec.md**: BDD-style capability spec. Use GIVEN/WHEN/THEN scenarios for key behaviors. Cover the main happy path, the main failure/edge case, and any platform-specific behavior.

5. **.openspec.yaml**: Use the game-end-screen example format. `status: done` for all artifacts. `apply.status: pending`. Include `dependencies` arrays where one artifact depends on another within the same change.

**Cross-change dependencies to reflect in `.openspec.yaml`:**
- `share-results-card` depends on `game-end-screen` being merged first (note in proposal.md; add `upstream: [game-end-screen]` comment in yaml).
- `phoneme-progress-charts` extends `data-progress` — note this is a same-repo change, no external dependency.
- `game-end-screen` and `player-stats-screen` both read from `data-progress` (already merged).
- `haptics-feedback` and `custom-celebration-per-lang` both trigger on the `checked12Trackers` event — note the shared trigger in each design.md.
- `font-scaling-accessibility` touches the theme that every other UI lib depends on; flag it as a wide-impact change in proposal.md.

Begin with `game-end-screen` and work through all 10 in order.
