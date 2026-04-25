# Bulk Spec Prompt — Batch 2A (Platform Infrastructure)

You are writing OpenSpec change artifacts for an Expo + React Native + TypeScript NX monorepo.

## Project summary

**AlphaTiles** — literacy game generator for minority-language communities. A language community supplies a folder of assets (tab-delimited wordlists, phoneme/tile data, audio, images, fonts) and the app renders that as tile-based literacy games in that language.

This is a port of a Java/Android app. The app already has the core game engine, 17 game mechanics, progress tracking, analytics abstraction, and a working Expo shell. Batch 2A specs cover platform infrastructure: analytics, crash reporting, CI/CD, E2E tests, web/tablet parity, store metadata, OTA delivery, and bundle-size gates.

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

Study these carefully — they define the format and quality bar. Note: `game-end-screen` itself is in Batch 2B; it's used here purely as a worked-example reference for output structure.

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

### 1. `analytics-firebase`

**Brief:** Implement a concrete Firebase Analytics adapter that satisfies the `AnalyticsAdapter` interface already defined in `shared/util-analytics`. The no-op adapter is the current default; this change swaps in a real Firebase backend. The adapter should live in a new `libs/alphaTiles/util-analytics-firebase` library (`type:util`, `scope:alphaTiles`). At app boot, the adapter is registered via `setAnalyticsAdapter(new FirebaseAnalyticsAdapter())`. Firebase project config is read from environment variables baked in at EAS build time.

**Special notes:**
- Must implement `track(event, props)`, `identify(playerId, traits)`, `screen(name, props)` — matching `AnalyticsAdapter` exactly.
- Use `@react-native-firebase/analytics` (already a common Expo dep); do not add a competing analytics SDK.
- Call `transformPropsToSnake(props)` before passing to Firebase (already exported from `shared/util-analytics`).
- Registration happens in `apps/alphaTiles/src/bootstrap.ts` (or equivalent boot file) — not in individual features.
- The adapter must respect `setAnalyticsEnabled(false)` — the base `track()` function gates calls before reaching the adapter, so the adapter itself does not need to check this flag.
- No user-facing UI — this is a pure infrastructure change.

---

### 2. `crash-reporting`

**Brief:** Integrate Sentry for error and crash tracking. Create a new `libs/alphaTiles/util-crash-reporting` library (`type:util`, `scope:alphaTiles`) that wraps `@sentry/react-native`. Sentry DSN is read from an environment variable baked in at EAS build time. The library exports `initCrashReporting()` (called at boot), `captureError(error, context?)`, and a `withCrashBoundary(Component)` HOC that wraps a React subtree in a Sentry error boundary. All unhandled JS errors and native crashes should be forwarded to Sentry.

**Special notes:**
- `initCrashReporting()` should be a no-op (warn and return) when `SENTRY_DSN` env var is absent, so dev builds work without credentials.
- Attach `playerId` and `langCode` (from `usePlayer` / `useLangAssets`) as Sentry scope tags after boot — implement a `<CrashReportingScope>` container that sets these tags when values become available.
- Do not wrap individual game containers — wrap the root app layout in `withCrashBoundary`.
- No user-facing UI (Sentry uploads crash reports silently).

---

### 3. `e2e-tests-maestro`

**Brief:** Add a Maestro end-to-end test suite covering the golden paths for the app: boot → choose player → navigate to a game → complete a round → return to menu. Maestro flows live in a new top-level `e2e/maestro/` directory. Each flow is a `.yaml` file. The change also adds an NX target `e2e:maestro` to `apps/alphaTiles/project.json` that runs `maestro test e2e/maestro/` against a running simulator/emulator.

**Special notes:**
- Flows to cover: (1) first-launch player creation, (2) game door tap → game loads, (3) correct answer tap → points increment, (4) back navigation to menu.
- Use `testID` props on key interactive elements to make flows stable; the design.md should enumerate which `testID` values are required and in which components.
- Maestro flows are YAML — not TypeScript. The spec should describe the flow steps in prose; the tasks checklist should guide the implementer to write the YAML.
- CI step: add a GitHub Actions job (or EAS workflow step) that boots the iOS simulator and runs the suite on every PR.

---

### 4. `ci-per-language-builds`

**Brief:** Configure EAS Build to produce one build profile per supported language pack, so that CI can produce a `yue-production` APK/IPA, an `eng-production` APK/IPA, etc. Each profile sets `APP_LANG` to the appropriate lang code. The change lives entirely in `eas.json` and a new `scripts/eas-build-matrix.ts` helper that prints the full matrix as JSON (for use in GitHub Actions matrix strategy). A new GitHub Actions workflow `ci-lang-builds.yml` triggers on pushes to `main` and dispatches all profiles in parallel.

**Special notes:**
- Profiles follow naming convention `<langCode>-<environment>` (e.g., `yue-production`, `eng-staging`).
- The matrix script reads a `SUPPORTED_LANGS` list from a config file (to be defined) — adding a new language requires only updating that list.
- EAS Submit config is out of scope — just build, not publish.
- Secrets (`EXPO_TOKEN`, signing certs) are already assumed to be in GitHub Secrets; the spec should note which secrets are required but not define how to obtain them.

---

### 5. `web-platform-parity`

**Brief:** Fix the known gaps between the Expo web build and the native builds: (1) audio does not play until a user gesture (browser autoplay policy) — add an audio unlock flow on web; (2) some layouts break on narrow browser viewports due to missing flex constraints; (3) add a `manifest.json` PWA manifest so the app is installable from Chrome/Safari. This change touches `apps/alphaTiles/` (app config, root layout) and potentially several `feature-*` and `ui-*` libs where layout is broken.

**Special notes:**
- Audio unlock: the `data-audio` lib already exports `useAudio()`; on web, wrap the root with a `<WebAudioUnlockGate>` component that renders a "Tap to start" overlay until the first user gesture unlocks the AudioContext. Fire `track({ type: 'audio_unlock_web', props: { millisecondsSinceBoot } })` when unlocked (this event already exists in `AnalyticsEvent`).
- PWA manifest: `name`, `short_name`, `icons` (at least 192×192 and 512×512), `start_url`, `display: standalone`, `theme_color` from `palette[0]`.
- Layout fixes: the design.md should enumerate the specific components known to break on web (at minimum: `ui-door-grid` overflow, `ui-score-bar` fixed height on narrow screens) and describe the fix for each.
- Do not introduce web-only code paths in shared libs — use `Platform.OS === 'web'` guards only in the app shell or dedicated web utility files.

---

### 6. `tablet-layout`

**Brief:** Add responsive breakpoints so the app looks intentional on iPad and Android tablet (768px+ wide). Currently all layouts are designed for ~390px wide phone screens; on tablet they stretch awkwardly. The fix: define a `useBreakpoint()` hook in `shared/util-theme` that returns `'phone' | 'tablet'` based on screen width, and update the main layout containers (`ui-door-grid`, `ui-game-board`, `GameShellContainer`) to use a centered max-width column on tablet.

**Special notes:**
- Breakpoint threshold: `>= 768dp` = tablet. Define as a constant in `util-theme`.
- `ui-door-grid` on tablet: two-column grid of doors (instead of one column), centered, max-width 600dp.
- `GameShellContainer` on tablet: game content centered in a max-width 500dp column with side padding.
- Do not redesign individual game UIs — only the shell chrome and door grid need tablet treatment in v1.
- `useBreakpoint()` should derive from `Dimensions.get('window')` with a `useMemo`; no event listener needed for v1 (re-render on rotation is acceptable via `key` pattern).

---

### 7. `storybook-visual-regression`

**Brief:** Add a CI step that runs Storybook, captures screenshots of all stories, and compares them against committed baseline images (visual regression). Use `@storybook/test-runner` with Playwright as the renderer. Baselines are committed to `storybook-baselines/` at the repo root. A GitHub Actions job runs on every PR; diff images are uploaded as artifacts on failure.

**Special notes:**
- The `storybook-host` lib already exists at `libs/shared/storybook-host/` — the CI job should build and serve that.
- Story discovery: `storybook-test-runner` scans `libs/**/*.stories.tsx` automatically.
- Threshold: allow up to 0.1% pixel difference before failing (to handle anti-aliasing variation).
- Update workflow: a separate `npm run update-storybook-baselines` script (or CI manual trigger) commits new baseline images.
- Only run on non-draft PRs to avoid burning CI minutes on WIP.

---

### 8. `app-store-metadata`

**Brief:** Create the store listing content for the App Store (iOS) and Google Play (Android) for the first production language: Yue (Cantonese). This change is primarily content — it defines the structure and required files, then fills them in for Yue. Content lives in `store-metadata/yue/` (to be created). The change also adds an EAS Submit config section to `eas.json` for Yue and documents the screenshot dimensions required.

**Special notes:**
- Required files per platform: `title.txt`, `short-description.txt` (Play only), `full-description.txt`, `keywords.txt`, `release-notes.txt`, screenshots (6.7" iPhone, 12.9" iPad, phone Android).
- Screenshots are captured manually (or via Maestro + simulator screenshot); the spec should define which screens to capture and in what order.
- Content should be written in Traditional Chinese (Yue audience) and English (App Store requires at least one English locale).
- Out of scope: automated screenshot generation (that is `storybook-visual-regression` territory).
- The `eng` language pack is not published to stores — it is a dev fixture only.

---

### 9. `lang-pack-downloader`

**Brief:** Add runtime OTA delivery of language packs beyond what EAS Update provides. Currently language packs are baked into the build; this change adds a mechanism to download an updated language pack ZIP from a CDN URL (configurable per build), unzip it into the app's document directory, and use that in preference to the bundled pack on next boot. The lib is `libs/alphaTiles/util-lang-pack-downloader` (`type:util`, `scope:alphaTiles`).

**Special notes:**
- Use `expo-file-system` for download + unzip.
- The CDN URL pattern is `<BASE_URL>/<langCode>/<version>.zip`; `BASE_URL` and `langCode` are baked in at build time via env vars.
- Version check: on boot, fetch `<BASE_URL>/<langCode>/latest.json` (contains `{ version, minAppVersion }`). If remote version > local version AND `minAppVersion` is compatible, download and stage the new pack.
- Staged pack is only activated on next full app boot (not hot reload) — write to `downloaded/<langCode>/` and read from there if it exists, else fall back to bundled assets.
- `util-ota` already exists and handles EAS OTA updates — `lang-pack-downloader` is a separate mechanism for language content specifically.

---

### 10. `performance-bundle-analysis`

**Brief:** Add a CI gate that tracks JavaScript bundle size and fails the build if the bundle grows beyond a threshold. Use `expo export` to produce a production bundle and `bundlesize` (or equivalent) to measure it. Results are posted as a PR comment. A separate profiling step uses `react-native-performance` to capture TTI (time-to-interactive) on the boot flow in a simulator.

**Special notes:**
- Bundle size threshold: 4 MB compressed JS (initial). Set in a `bundlesize.config.json` at the repo root.
- The CI step runs on every PR; baseline is the main branch bundle size.
- Profiling (TTI) is a separate, manual-trigger workflow — not a blocking gate — because it requires a simulator.
- The spec should note which NX targets / Expo commands produce the bundle (`nx build alphaTiles --configuration=production` or `expo export`).
- Out of scope: native binary size tracking (APK/IPA size) — that is `ci-per-language-builds` territory.

---

## Your task

Generate the 5 OpenSpec artifacts for each of the 10 changes listed above.

**Process in this order:**
analytics-firebase, crash-reporting, e2e-tests-maestro, ci-per-language-builds, web-platform-parity, tablet-layout, storybook-visual-regression, app-store-metadata, lang-pack-downloader, performance-bundle-analysis

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
- `analytics-firebase` depends on `analytics-abstraction` being merged (already true — note as "upstream merged").
- `crash-reporting` is independent infra; it touches the root app layout, which `analytics-firebase` also touches at boot — note potential merge-conflict surface in proposal.md.
- `ci-per-language-builds` and `performance-bundle-analysis` both add GitHub Actions workflows — note that they should not collide on workflow filenames.
- `storybook-visual-regression` depends on the existing `storybook-host` lib (already merged).

Begin with `analytics-firebase` and work through all 10 in order.
