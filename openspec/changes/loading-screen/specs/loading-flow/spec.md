## ADDED Requirements

### Requirement: Single boot-time async orchestration surface

The loading screen (`libs/alphaTiles/feature-loading`) SHALL be the only screen in the app that performs async initialization. All feature screens downstream SHALL read from already-loaded context / stores synchronously.

#### Scenario: Feature screen reads synchronously

- **WHEN** `/choose-player` mounts after the loading screen has completed
- **THEN** `useLangAssets()`, `useActivePlayer()`, `t('tile:a')`, and any pre-registered audio handle return valid values synchronously
- **AND** `/choose-player` renders no loading spinner of its own

#### Scenario: No feature lib has an async boot hook

- **WHEN** any `libs/alphaTiles/feature-*` library is inspected
- **THEN** it declares no `async` boot function or initialization promise

### Requirement: Phase sequence order

The loading sequence SHALL execute phases in this order: `fonts` → `i18n` → `web-gate` (web only) → `audio` → `precompute` → `hydration` → `done`. Each phase MUST complete before the next begins.

#### Scenario: Native platform sequence

- **WHEN** the app boots on iOS or Android
- **THEN** the phases run: fonts, i18n, audio, precompute, hydration, done
- **AND** no `web-gate` phase runs

#### Scenario: Web platform sequence

- **WHEN** the app boots on web
- **THEN** the phases run: fonts, i18n, web-gate, audio, precompute, hydration, done
- **AND** the `audio` phase does not start until `web-gate` completes (user tap)

#### Scenario: Phase ordering guarantees

- **WHEN** the `audio` phase starts
- **THEN** fonts are already loaded and i18n content namespaces are already registered

### Requirement: Splash screen handoff

Expo's native splash SHALL be held with `SplashScreen.preventAutoHideAsync()` and hidden by the loading container via `SplashScreen.hideAsync()` on its first paint. The loading screen's own progress UI SHALL render immediately after the splash hides.

#### Scenario: Splash hidden promptly

- **WHEN** `LoadingContainer` mounts
- **THEN** `SplashScreen.hideAsync()` is called before the boot sequence begins
- **AND** the loading-screen progress ring is visible within one React frame

#### Scenario: Double-hide tolerance

- **WHEN** `SplashScreen.hideAsync()` throws because the splash is already hidden
- **THEN** the error is swallowed and the boot sequence continues

### Requirement: Audio preload progress display

The loading screen SHALL display progress as a percentage of `audioLoaded / audioTotal` during the `audio` phase. Progress updates from `data-audio`'s `preloadAudio` SHALL be batched at most once per 10 files or per 250ms, whichever comes first.

#### Scenario: Progress visible during preload

- **WHEN** 150 of 300 audio files have preloaded
- **THEN** the progress ring / bar displays 50%

#### Scenario: Progress update batching

- **WHEN** 300 audio files load in ~5s
- **THEN** the progress React state receives at most ~30 updates (roughly one per 10 files), not 300

#### Scenario: Initial progress value

- **WHEN** the `audio` phase begins and no files have loaded yet
- **THEN** the progress display reads 0%

### Requirement: Per-file audio preload timeout

The audio preload SHALL treat a single file's load as failed after 30 seconds. A failed file SHALL be logged and the progress counter SHALL advance as if the file succeeded; the sequence MUST continue.

#### Scenario: Single-file stall

- **WHEN** one audio file fails to load within 30s
- **THEN** the file is logged via `console.warn` with its key and path
- **AND** the progress counter advances
- **AND** the remaining files continue to load

#### Scenario: Eventual completion despite failure

- **WHEN** one file times out but all others succeed
- **THEN** the `audio` phase reaches 100% and the sequence advances to `precompute`

### Requirement: Web audio-unlock gesture

On `Platform.OS === 'web'`, the loading screen SHALL display a "Tap to begin" button during the `web-gate` phase. The button's press handler SHALL call `unlockAudio()` from `data-audio` and transition to the `audio` phase on resolution.

#### Scenario: Web user taps

- **WHEN** the web user taps "Tap to begin"
- **THEN** `unlockAudio()` is invoked within a user-gesture event handler
- **AND** the button is replaced by the progress ring
- **AND** the `audio` phase starts

#### Scenario: Native platform skips gate

- **WHEN** the app boots on iOS or Android
- **THEN** no "Tap to begin" button is rendered
- **AND** the `audio` phase starts immediately after `i18n`

### Requirement: Players store hydration gate

The sequence SHALL NOT advance past the `hydration` phase until `usePlayersStore.persist.hasHydrated()` returns `true`. Route transition to `/choose-player` or `/menu` MUST only fire after hydration completes.

#### Scenario: Hydration already complete

- **WHEN** hydration finished during earlier phases
- **THEN** the `hydration` phase resolves immediately

#### Scenario: Hydration pending

- **WHEN** `hasHydrated()` is `false` when the phase begins
- **THEN** the sequence subscribes via `persist.onFinishHydration` and waits
- **AND** advances to `done` once the subscription fires

### Requirement: Route transition on completion

On reaching the `done` phase, the loading screen SHALL call `router.replace` (not `push`) with either `/menu` (if `activePlayerId` identifies an existing player) or `/choose-player` (otherwise). A stale `activePlayerId` (non-null but not matching any player) SHALL resolve to `/choose-player`.

#### Scenario: Active player resume

- **WHEN** `activePlayerId` matches a player in the store
- **THEN** the loading screen `router.replace('/menu')`

#### Scenario: First launch

- **WHEN** `activePlayerId` is null
- **THEN** the loading screen `router.replace('/choose-player')`

#### Scenario: Stale active id

- **WHEN** `activePlayerId = 'abc-def'` but no player with that id exists
- **THEN** the loading screen `router.replace('/choose-player')`

#### Scenario: Replace semantics

- **WHEN** route transition fires
- **THEN** the navigation stack does not retain the loading screen; `router.back()` from `/choose-player` is a no-op

### Requirement: Accessibility announcements

The loading screen SHALL expose phase and progress as accessible text. On Android, the progress-text node SHALL carry `accessibilityLiveRegion="polite"`. Progress announcements SHALL fire on phase transitions and at 25% / 50% / 75% / 100% of audio preload.

#### Scenario: Label announces progress

- **WHEN** audio preload crosses 50%
- **THEN** the progress label text updates to the localized "Loading 50%" string
- **AND** on Android, the live region propagates the change to TalkBack

#### Scenario: Phase transition announces

- **WHEN** the sequence advances from `audio` to `precompute`
- **THEN** the label text changes to the localized loading title, triggering another live-region update

### Requirement: Error surface on boot failure

If any phase's underlying promise rejects, the loading screen SHALL stop advancing, display a localized error message (`chrome:loading.error`), and log the original error to the console. The sequence SHALL NOT retry.

#### Scenario: Font load fails

- **WHEN** `useFonts()` throws
- **THEN** the boot sequence stops, the screen displays the error message, and `console.error` records the thrown value

#### Scenario: Precompute throws

- **WHEN** a registered precompute function throws during `runPrecomputes`
- **THEN** the phase surfaces the error with the precompute key attached (per `util-precompute` spec) and the loading screen displays the error message

#### Scenario: No automatic retry

- **WHEN** the loading screen is in the error state
- **THEN** no further boot attempts run until the app is fully reloaded

### Requirement: Library boundaries

`libs/alphaTiles/feature-loading` SHALL be `type:feature`, `scope:alphaTiles`. It MAY depend on `data-language-assets`, `data-audio`, `data-players`, `data-i18n`, `util-i18n`, `util-theme`, `util-precompute`, `expo-router`, `expo-splash-screen`, `expo-font`. Its presenter SHALL NOT import `react-i18next` — the container passes `labels` as pre-translated strings.

#### Scenario: Presenter purity

- **WHEN** `LoadingScreen.tsx` (presenter) is rendered in Storybook with raw `labels` props
- **THEN** it renders correctly with no i18n or router provider wrapping the story

#### Scenario: `bootSequence` testability

- **WHEN** `bootSequence` is imported in a unit test
- **THEN** it runs to completion (or throws) without React or any Expo module needing to be mounted
