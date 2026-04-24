## Context

The Android source puts all audio loading into `LoadingScreen.onCreate` — three or four parallel `Thread`s against `SoundPool.load`, a shared `OnLoadCompleteListener` ticking a progress bar, and a final `startActivity(ChoosePlayer)` once `audio_loaded == totalAudio`. Fonts, i18n, and per-class precomputes are handled elsewhere (fonts are Android XML resources resolved by the OS; i18n is per-screen string lookups; precomputes are `static { }` initializers or run on first game entry).

The React-Native port inherits `SoundPool`'s behavior from `expo-audio` but cannot inherit the rest of the environment. Specifically:

1. **Fonts** — `expo-font`'s `useFonts()` hook is the only reliable way to register custom TTFs on iOS / Android / Web. It's async.
2. **i18n content namespaces** — per ADR-006, content strings are registered at boot via `i18n.addResources(BUILD_LANG, ns, data)`. This must happen once before any feature screen calls `t('tile:a')`.
3. **Precomputes** — `util-precompute`'s `runPrecomputes(assets)` (scaffolded in `port-foundations`) must run once against the loaded asset state before any game feature enters.
4. **Web audio gesture** — browsers block `AudioContext` until a user gesture. The loading screen must surface a tap before it can preload audio.
5. **Players store hydration** — Zustand `persist` is async; the initial-route derivation in `player-profiles` relies on `hasHydrated() === true`. The loading screen must gate on it.

Centralizing these five orchestrations in one screen mirrors the Android choice and keeps every downstream screen free of loading states. The trade-off: the loading screen becomes the single most-important sequence in the app.

`LangAssetsProvider` (from `data-language-assets`, defined by the `lang-assets-runtime` change) is synchronous — it reads the boot-time-generated `langManifest.ts` module, whose `require()` calls the Metro runtime has already resolved. So by the time `LoadingContainer` mounts, `useLangAssets()` returns a fully-resolved object. The loading screen does not need to wait for pack parsing; it needs to wait for the five above.

The sequence is therefore:

```
splash (Expo)
  ↓   (LoadingContainer mounts, calls SplashScreen.hideAsync)
[1] useFonts()                                  ← expo-font
  ↓
[2] registerContentNamespaces(langAssets)       ← data-i18n
  ↓
[3] Platform.OS === 'web' ? show "Tap to begin" : continue
  ↓   (on web: user taps → unlockAudio())
[4] preloadAudio(onProgress)                    ← data-audio
  ↓
[5] runPrecomputes(langAssets)                  ← util-precompute
  ↓
[6] await usePlayersStore.persist.hasHydrated() === true
  ↓
[7] router.replace('/choose-player' or '/menu') ← player-profiles
```

Steps 1 and 2 are fast (< 100ms each typically) and gated without user-visible progress. Step 4 is the long one (proportional to `totalAudio` — hundreds of mp3s for English). Step 6 is typically already done before step 4 completes (AsyncStorage is fast). The progress bar shown to the user reflects step 4 progress exclusively.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §6 (runtime data flow), §8 (audio — preload semantics), §9 (fonts + theme boot), §10 (i18n content-namespace boot), §13 (routing).
- `docs/decisions/ADR-006-i18n-unified-i18next.md`, `ADR-007-audio-expo-audio.md`, `ADR-005-persistence-zustand-persist-asyncstorage.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `audio-system` — `preloadAudio(onProgress)`, `unlockAudio()`.
  - `theme-fonts` — `useFonts()` integration, palette readiness.
  - `i18n-foundation` — `registerContentNamespaces(langAssets)`.
  - `lang-assets-runtime` — `useLangAssets()` + `runPrecomputes(assets)`.
  - `player-profiles` — `usePlayersStore.persist.hasHydrated()` + initial-route logic.
  - `port-foundations` — `util-precompute` registry.
  - Read each of those changes' `design.md` in full.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/LoadingScreen.java` — orchestration reference (thread-based SoundPool preload + progress bar + transition to `ChoosePlayer`).
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` — for the `audio_loaded`/`totalAudio` counter pattern.
  - `../AlphaTiles/app/src/main/res/layout/activity_loading_screen.xml` — layout reference (progress ring).
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/*.mp3` — full audio preload set to benchmark against.
  - `../PublicLanguageAssets/engEnglish4/res/font/*.ttf` — fonts that `useFonts()` must register.
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_*.txt` — source of content namespaces.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/aa_*.txt` + `.mp3` / `.ttf` — parity fixture.

## Goals / Non-Goals

**Goals:**

- Loading screen is the only async-initialization surface in the app.
- Progress indicator reflects actual audio preload progress (percent of loaded / total).
- Web `AudioContext` unlocks before any audio load attempt that depends on it.
- Stalled audio loads do not block the UI forever (per-file 30s timeout, log-and-continue).
- The players store's hydration is awaited before route transition (prevents a race where `/choose-player` reads stale empty state).
- Splash screen hides as soon as the loading screen's first frame paints.
- Screen announces progress changes to screen readers.
- Route transition is `router.replace` so the stack never contains the loading screen.

**Non-Goals:**

- Retry on audio-load failure — logged, not retried. A reload of the app restarts the sequence.
- Partial boot (skip audio preload, load on-demand during gameplay). The port consolidates on-boot preload; on-demand would require a different architecture that's not merited for KB-scale audio budgets.
- Fancy animations during loading. V1 is a progress ring; polish later.
- Allowing the user to interrupt loading. Back-navigation from the loading screen is disabled; there is nowhere to go.
- Supporting multiple boot sequences per app launch. The sequence runs once; subsequent screens never re-enter it.

## Decisions

### D1. `LoadingContainer` orchestration via derived state (no `useEffect` anti-pattern)

Per `CLAUDE.md`, direct `useEffect` is prohibited. The orchestration is instead modeled as a state machine driven by promises and `useState`:

```ts
type Phase = 'fonts' | 'i18n' | 'web-gate' | 'audio' | 'precompute' | 'hydration' | 'done';
const [phase, setPhase] = useState<Phase>('fonts');
const [audioProgress, setAudioProgress] = useState(0);
const [error, setError] = useState<Error | null>(null);
```

Phase transitions happen inside event-handler-like promise chains, not in `useEffect`. A boot helper runs at mount via `useMountEffect` (the allowed wrapper — see `docs/CODE_STYLE.md`):

```ts
useMountEffect(() => {
  bootSequence({
    onPhaseChange: setPhase,
    onAudioProgress: setAudioProgress,
    onError: setError,
    onComplete: () => router.replace(resolveEntryRoute()),
  });
});
```

`bootSequence` is a pure async function exported from `libs/alphaTiles/feature-loading` — testable without React. It invokes the steps in order, awaiting each, and calls back to the React state via the callbacks.

Decision: **`useMountEffect` is the one allowed effect site** because this genuinely is a mount-time kickoff with no re-run semantics. The alternative (moving the whole sequence into event handlers fired by a button) doesn't fit a loading screen.

Decision: **`bootSequence` is exportable and unit-testable** — React is only used for the progress UI. The orchestration logic has jest coverage independent of the presenter.

### D2. Audio preload progress batching

Android calls back on every file. Web with 328 word audios firing 328 React state updates in rapid succession will thrash re-renders, especially on low-end Androids and on web.

Decision: **batch progress updates at most every 10 files or every 250ms, whichever comes first.** The progress callback from `data-audio`'s `preloadAudio(onProgress)` is a light wrapper that applies this batching — `data-audio` exposes a `preloadAudio({ batchEvery })` option.

```ts
await preloadAudio({ onProgress: setAudioProgress, batchEvery: { count: 10, ms: 250 } });
```

### D3. Per-file timeout + continue-on-failure

Android's `SoundPool.load` doesn't have a timeout — a pathological mp3 can hang the listener indefinitely. Web's `fetch(url)` + `AudioContext.decodeAudioData` is more bounded but not timeout-free.

Decision: **`data-audio`'s `preloadAudio` wraps each file in a `Promise.race` with a 30s timeout.** On timeout, the file is logged (`console.warn('[loading] timeout preloading', key, path)`) and the progress counter advances as if it had succeeded. At gameplay time, trying to play that key produces a no-op + logged warning; the game proceeds silently. This is graceful degradation — preferable to hanging boot.

Decision: **timeout is per-file, not per-batch.** A single stuck file doesn't hold up its peers because loads are parallelized anyway.

### D4. Web `unlockAudio()` gesture

On web, Chrome / Safari block `AudioContext.resume()` until a user-triggered event handler runs. `data-audio` exposes `unlockAudio(): Promise<void>` which (on web) creates and resumes an `AudioContext` inside a user-gesture event handler; on native, it's a no-op that resolves immediately.

The loading screen's web-gate phase renders a "Tap to begin" button. The `onPress` handler:

```ts
onPress: async () => {
  await unlockAudio();
  setPhase('audio');
}
```

Decision: **the gate is only shown when `Platform.OS === 'web'`.** Native platforms skip the phase entirely (`setPhase('audio')` is called directly after i18n).

Decision: **the button is the sole interactive element during the gate phase.** No skip, no alternatives — the web build fundamentally cannot proceed without a user gesture.

Decision: **after unlock, the button is replaced by the progress ring — not routed to a new screen.** The user is already on the loading screen; we don't switch screens for a phase transition.

### D5. Splash screen handoff

`expo-splash-screen` auto-hides when the first React view paints. But we want to hide it manually so the loading screen's own frame shows first with the progress ring already styled.

At module load:

```ts
// apps/alphaTiles/app/_layout.tsx
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();
```

Inside `LoadingContainer`:

```ts
useMountEffect(() => {
  SplashScreen.hideAsync().catch(() => {});   // swallow — hideAsync can throw if already hidden
  bootSequence(/* … */);
});
```

Decision: **splash is hidden before the boot sequence starts, not after it finishes.** The user sees the loading-screen progress ring as early as possible; staying on the native splash for the entire audio-preload duration would be a worse UX.

### D6. `accessibilityLiveRegion` for progress announcements

Progress changes need to be announced to screen-reader users. React Native's `accessibilityLiveRegion="polite"` (Android) / `accessibilityLabel` update + `AccessibilityInfo.announceForAccessibility` (iOS) are the path. For simplicity we use `accessibilityLiveRegion="polite"` on the progress label and update its text; the platform handles announcement.

Decision: **announce at phase transitions + every 25% of audio progress.** Fine-grained announcements (every 1%) would flood the screen reader queue.

```ts
const label = phase === 'audio'
  ? t('chrome:loading.progress', { percent: Math.floor(audioProgress * 100) })
  : t('chrome:loading.title');
<Text accessibilityLiveRegion="polite" accessibilityRole="text">{label}</Text>
```

### D7. Completion gate composition

The route transition fires only when all of these are true:

- `phase === 'done'` (the sequencer has walked through all phases)
- `usePlayersStore.persist.hasHydrated()` returns `true`

In practice, step 6 of the sequence explicitly awaits the players-store hydration:

```ts
async function awaitPlayersHydrated() {
  if (usePlayersStore.persist.hasHydrated()) return;
  await new Promise<void>(resolve => {
    const unsub = usePlayersStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
```

Decision: **hydration is a step in the sequencer, not a separate concurrent gate.** Sequencing is simpler than two-variable-guarded transitions. On slow disks hydration may be the longest step; in practice audio preload dominates.

Decision: **the sequencer ordering places hydration AFTER audio preload.** Reasoning: we want the progress ring to reflect audio (the visible work), and hydration is near-instant. Blocking the route transition on hydration at the end is a cheap final check.

### D8. Error handling

If any step throws (audio-system crashes, i18n registration throws, precompute throws), `error` is set and the screen renders a minimal error message (`t('chrome:loading.error')`) plus a console.error with the thrown value. The sequencer does not continue past the erroring step.

Decision: **no retry button in v1.** A broken pack or environment is a developer-side problem; the shipped app is built against a validated pack so runtime boot errors indicate bugs we should fix, not transient faults to retry around.

Decision: **errors propagate out of `bootSequence` as a rejected promise.** The React state `error` is set in the `.catch` of the top-level `bootSequence(…)` call.

### D9. Library structure

```
libs/alphaTiles/feature-loading/
  src/
    index.ts                          # barrel: only `LoadingContainer`
    LoadingContainer.tsx              # container
    LoadingScreen.tsx                 # presenter
    bootSequence.ts                   # pure async orchestrator
    resolveEntryRoute.ts              # reads players store, returns '/choose-player' | '/menu'
    awaitPlayersHydrated.ts           # gate helper
    __tests__/
      bootSequence.test.ts            # phase-by-phase, error injection
      resolveEntryRoute.test.ts       # active / inactive / stale id
```

Decision: **one function per file, no barrel except root `index.ts`** — per project convention.

Decision: **`LoadingScreen` (presenter) accepts `phase`, `audioProgress`, `error`, `onTapToBegin`, `labels: { title; progress; tapToBegin; error }` as props.** No hooks, no i18n, no router — pure. Storybook can show all 7 phase states without any runtime.

### D10. Route decision

`resolveEntryRoute(): '/choose-player' | '/menu'`:

```ts
const active = useActivePlayer.getState(); // or usePlayersStore.getState() + derive
if (active && active.id) return '/menu';
return '/choose-player';
```

Decision: **entry route decision lives in this lib**, not in `player-profiles`, because the loading screen is what navigates to it. `player-profiles` owns the store + route definitions; `loading-screen` owns the transition logic.

## Risks / Trade-offs

- **[Risk]** A bug in `bootSequence` leaves `phase` stuck. **Mitigation**: the unit tests drive each phase transition; a hang manifests as a hung test. Dev-mode observers (console.log per phase entry) also help.
- **[Risk]** `expo-splash-screen` versioning skew causes `preventAutoHideAsync` to throw. **Mitigation**: pin to the SDK-matched version in `package.json`; wrap the `hideAsync` call in `.catch(() => {})`.
- **[Risk]** Web user never taps "Tap to begin" — loading screen persists forever. **Mitigation**: same as any web app with audio — acceptable; documented in the pack-authoring guide.
- **[Trade-off]** 30s per-file timeout means a broken 300-file pack could show a stuck progress bar for (up to) 150 minutes if files are loaded strictly serially. **Mitigation**: `data-audio` parallelizes loads; in practice all files race together and the worst case is ~30s. Acceptable.
- **[Trade-off]** Centralized boot makes the loading screen a critical path; a bug here breaks the whole app. **Accepted**: same trade-off as Android. The consolidation benefit (no loading states anywhere else) outweighs the single-point-of-failure risk, which is mitigated by tests.
- **[Trade-off]** `accessibilityLiveRegion="polite"` is Android-only; iOS uses a different mechanism. We only set the attribute on Android; iOS relies on screen-reader re-reading when the label text changes (which VoiceOver does). Web uses `aria-live` via React Native Web's mapping.

## Migration Plan

1. Land `feature-loading` with `bootSequence` fully covered by unit tests (phase sequencing, error injection, timeout handling).
2. Land the `LoadingScreen` presenter with Storybook stories for each phase.
3. Update `apps/alphaTiles/app/index.tsx` to re-export `LoadingContainer`.
4. Update `apps/alphaTiles/app/_layout.tsx` to `SplashScreen.preventAutoHideAsync()`.
5. Add `chrome:loading.*` to `locales/en.json`.
6. Manual-verify on web, iOS sim, Android emulator against `eng` and `tpx`.

Rollback: revert the commit. The empty-shell `index.tsx` returns; downstream screens are not yet wired to require a loading gate.

## Open Questions

- Should the progress indicator be a ring, a bar, or tile-drop animation? **Ring for v1 — simple and a11y-friendly. Animation polish deferred.**
- Should we preload words + tiles + syllables in that priority order (so the first game entered is most likely to have its audio ready even if full preload isn't done)? **v1: preload in arbitrary order and block entry on full completion. Progressive boot is a future optimization.**
- Does `util-precompute` need an async version? Right now `runPrecomputes` is synchronous. If any precompute function needs async, the step becomes `await` — out-of-scope until a game class demands it.
- What if the pack's audio inventory grows past ~1000 files? Preload time scales linearly; an RTL / large-script pack may push past the 15s target. **Accepted v1**; revisit with real pack data.
