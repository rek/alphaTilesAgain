## Why

The Java `LoadingScreen` activity kicks off three parallel background threads (`loadGameAudio`, `loadWordAudio`, and conditionally `loadTileAudio` + `loadSyllableAudio`), displays a progress bar driven by `SoundPool.OnLoadCompleteListener`, and navigates to `ChoosePlayer` once `audio_loaded == totalAudio`. Every game screen downstream assumes audio handles are live in `Start.tileAudioIDs` / `wordAudioIDs` / `syllableAudioIDs` and that `Start.speechIDs` is populated. There is nowhere else in the app that does async setup. The port needs a single screen that owns all async initialization (audio preload + font registration + i18n content-namespace registration + per-class precomputes) so that every subsequent screen can synchronously read from pre-populated context and stores. Without this consolidation, each feature would have to handle its own loading state, conditional rendering, and audio-not-ready branches — the problem the Android source also chose to solve centrally.

## What Changes

- Add `libs/alphaTiles/feature-loading` (type:feature) — `LoadingContainer` (boot orchestrator) + `LoadingScreen` (progress presenter). Container sequences: font load → i18n content registration → audio preload → precompute run → route to `/choose-player` (or to web-gesture interstitial first on web).
- Update `apps/alphaTiles/app/index.tsx` (the root route) to render `<LoadingContainer />`. This is the app's boot screen.
- Add chrome i18n keys for progress announcement: `chrome:loading.title`, `chrome:loading.progress` (`"Loading {{percent}}%"`), `chrome:loading.tap_to_begin`, `chrome:loading.error`.
- Add an `expo-splash-screen` hook — the splash hides as soon as `LoadingContainer` paints its first frame. The progress display then lives inside the loading screen itself.
- Wire the web-only `unlockAudio()` interstitial: after fonts load (step 3) and before audio preload (step 4), on `Platform.OS === 'web'` the screen replaces the progress indicator with a "Tap to begin" button. Tapping calls `unlockAudio()` from `data-audio`, hides the button, and continues the sequence.
- The loading screen reads `usePlayersStore.persist.hasHydrated()` as part of its completion gate — it does not advance until the players store has finished rehydrating.
- On boot-complete, the loading screen routes via `router.replace` to either `/choose-player` or `/menu` depending on `activePlayerId` (routing decision is spec'd in `player-profiles`).

## Capabilities

### New Capabilities

- `loading-flow`: the single boot-time async orchestration surface. Owns the ordering of font load, i18n content registration, audio preload, precompute execution, web audio-unlock gesture, and the gate-to-first-screen transition.

### Modified Capabilities

_None_ — this change introduces the boot sequence for the first time. `port-foundations` only established build-time pipeline (rsync → manifest), not runtime boot. No prior capability defines or contradicts loading-flow behavior.

## Impact

- **New lib**: `libs/alphaTiles/feature-loading`.
- **Modified app files**: `apps/alphaTiles/app/index.tsx` (re-export of `LoadingContainer`), `apps/alphaTiles/app/_layout.tsx` (calls `expo-splash-screen` `preventAutoHideAsync()` at module load, `hideAsync()` on first loading-screen paint).
- **New dependencies**: `expo-splash-screen`, `expo-font` (both are Expo SDK modules — no native link work), `@react-native-async-storage/async-storage` (already pulled in by `player-profiles`).
- **New chrome i18n keys**: `chrome:loading.*`.
- **Behavioral contract for every other change**: after this change lands, no feature screen may do its own async initialization. Audio handles, parsed asset maps, registered i18n content, and precompute results are all available synchronously by the time any non-loading screen mounts.
- **Consumed by**: every feature change — `player-profiles` receives a fully-hydrated players store; `game-menu` and `game-engine-base` receive pre-resolved `LangAssets` and pre-run precomputes; `audio-system` is invoked for preload.
- **Risk**: a preload stall on a single audio file could block boot indefinitely — mitigated by per-file 30s timeout and continue-on-failure (logged).
- **No breaking changes** — the only prior occupant of the route (`apps/alphaTiles/app/index.tsx`) was the empty shell placeholder.

## Out of Scope

- The audio preload logic itself — lives in `libs/alphaTiles/data-audio` spec'd by the `audio-system` change. This change calls `preloadAudio(onProgress)` and consumes the progress callback.
- The i18n content-namespace registration logic — lives in `libs/alphaTiles/data-i18n` (and the runtime piece in `lang-assets-runtime`). This change calls `registerContentNamespaces(langAssets)` and awaits it.
- The precompute execution logic — lives in `libs/shared/util-precompute` (scaffolded by `port-foundations`). This change calls `runPrecomputes(langAssets)`.
- Error recovery UI (retry button, diagnostic report) — v1 logs to console and shows a generic "Something went wrong" message. Richer error UX is a future change.
- Skeleton UI behind the progress bar (animated dots, tile-drop animation) — v1 is a progress ring plus localized pack name. Visual polish is a future change.
