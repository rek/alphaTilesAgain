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

## 1. Library scaffold

- [ ] 1.1 `nx g @nx/react:lib feature-loading --directory=libs/alphaTiles/feature-loading --tags='type:feature,scope:alphaTiles'`
- [ ] 1.2 Add deps: `expo-splash-screen`, `expo-font` (SDK-matched versions in `package.json`)
- [ ] 1.3 Confirm `expo-router`, `zustand`, `@react-native-async-storage/async-storage` are already installed (pulled by `player-profiles`)

## 2. `bootSequence.ts` — pure orchestrator

- [ ] 2.1 Define `Phase = 'fonts' | 'i18n' | 'web-gate' | 'audio' | 'precompute' | 'hydration' | 'done'`
- [ ] 2.2 Signature: `bootSequence(opts: { onPhaseChange: (p: Phase) => void; onAudioProgress: (n: number) => void; platform: 'web' | 'native'; waitForWebGesture?: () => Promise<void>; }) => Promise<void>`
- [ ] 2.3 Implement phase execution:
  - [ ] 2.3.1 `fonts`: call `loadFontsAsync()` via `expo-font`
  - [ ] 2.3.2 `i18n`: call `registerContentNamespaces(langAssets)` from `data-i18n`
  - [ ] 2.3.3 `web-gate`: if web, await the passed-in gesture promise; else skip
  - [ ] 2.3.4 `audio`: call `preloadAudio({ onProgress: opts.onAudioProgress, batchEvery: { count: 10, ms: 250 } })`
  - [ ] 2.3.5 `precompute`: call `runPrecomputes(langAssets)`
  - [ ] 2.3.6 `hydration`: call `awaitPlayersHydrated()`
  - [ ] 2.3.7 `done`: resolve
- [ ] 2.4 Any thrown error propagates as rejected promise; no retry
- [ ] 2.5 Unit tests:
  - [ ] 2.5.1 Native path: phases emit in order (fonts, i18n, audio, precompute, hydration, done)
  - [ ] 2.5.2 Web path: phases include web-gate between i18n and audio
  - [ ] 2.5.3 Thrown font-load error: rejects, stops emitting phases
  - [ ] 2.5.4 `onAudioProgress` fires with increasing values
  - [ ] 2.5.5 Web gate waits for the passed promise before advancing

## 3. `awaitPlayersHydrated.ts`

- [ ] 3.1 Export async `awaitPlayersHydrated(): Promise<void>`
- [ ] 3.2 If `usePlayersStore.persist.hasHydrated()` → resolve immediately
- [ ] 3.3 Else subscribe via `persist.onFinishHydration`, unsub + resolve on first call
- [ ] 3.4 Unit tests: already-hydrated path, pending-hydration path, multiple-subscribers path

## 4. `resolveEntryRoute.ts`

- [ ] 4.1 Export `resolveEntryRoute(): '/choose-player' | '/menu'`
- [ ] 4.2 Read `usePlayersStore.getState()`; return `/menu` iff `activePlayerId` matches a player record, else `/choose-player`
- [ ] 4.3 Unit tests: active match, active null, stale id (non-null but unmatched)

## 5. `LoadingScreen.tsx` — presenter

- [ ] 5.1 Props: `{ phase: Phase; audioProgress: number; error: Error | null; onTapToBegin?: () => void; labels: { title: string; progress: string; tapToBegin: string; error: string; } }`
- [ ] 5.2 Render pack name + app logo in `title` slot
- [ ] 5.3 Render progress ring (SVG or RN animated) showing `audioProgress` during `audio` phase, indeterminate during other phases
- [ ] 5.4 Render "Tap to begin" button when `phase === 'web-gate'` and `onTapToBegin` is defined
- [ ] 5.5 Render error message when `error` is non-null
- [ ] 5.6 Progress label: `<Text accessibilityLiveRegion="polite">{labels.progress}</Text>`
- [ ] 5.7 No `react-i18next` / `useRouter` / store imports — pure props
- [ ] 5.8 Storybook stories: one per phase (fonts, i18n, web-gate, audio-25%, audio-50%, audio-100%, precompute, hydration, done, error)

## 6. `LoadingContainer.tsx`

- [ ] 6.1 `useState` for `phase`, `audioProgress`, `error`, and a `webGestureResolver` ref
- [ ] 6.2 `useRouter()`, `useLangAssets()`, `useTranslation('chrome')`
- [ ] 6.3 `useMountEffect` kicks off:
  - [ ] 6.3.1 `SplashScreen.hideAsync().catch(() => {})`
  - [ ] 6.3.2 `bootSequence({ ... })` — wires `setPhase`, `setAudioProgress` callbacks; passes `waitForWebGesture` returning a promise that resolves when the tap-to-begin button is pressed; catches errors into `setError`
  - [ ] 6.3.3 On complete, `router.replace(resolveEntryRoute())`
- [ ] 6.4 Compute `labels` from `t()` calls; pass to presenter along with state
- [ ] 6.5 Platform detection: `Platform.OS === 'web'` → set `platform: 'web'`; else `'native'`

## 7. Route + root layout wiring

- [ ] 7.1 Update `apps/alphaTiles/app/index.tsx` to `export { LoadingContainer as default } from '@alphaTiles/feature-loading'`
- [ ] 7.2 In `apps/alphaTiles/app/_layout.tsx` (root layout), at module top level: `import * as SplashScreen from 'expo-splash-screen'; SplashScreen.preventAutoHideAsync();`
- [ ] 7.3 Ensure `/choose-player`, `/set-player-name`, `/menu` route files are present (may be stubs until those features land)

## 8. i18n chrome keys

- [ ] 8.1 Add to `apps/alphaTiles/locales/en.json`:
  - `loading.title` — `"Loading {{appName}}"`
  - `loading.progress` — `"Loading {{percent}}%"`
  - `loading.tap_to_begin` — `"Tap to begin"`
  - `loading.error` — `"Something went wrong. Please restart."`

## 9. `data-audio` `preloadAudio` contract

_(cross-references the `audio-system` change which owns this API)_

- [ ] 9.1 Confirm `preloadAudio({ onProgress, batchEvery })` signature is spec'd by `audio-system`
- [ ] 9.2 Confirm `unlockAudio()` signature — no-op on native, resumes `AudioContext` on web — is spec'd by `audio-system`
- [ ] 9.3 If either is missing, amend `audio-system` rather than inlining here

## 10. Verification

- [ ] 10.1 `APP_LANG=eng nx start alphaTiles` — splash hides, loading screen paints, progress reaches 100%, routes to `/choose-player`
- [ ] 10.2 Kill the app mid-load; relaunch → loading runs again and completes cleanly
- [ ] 10.3 `APP_LANG=eng nx web-export alphaTiles` + serve → web build shows "Tap to begin"; after tap, audio preloads, routes to `/choose-player`
- [ ] 10.4 With a deliberately broken audio file, boot completes with a console warning (not a hang)
- [ ] 10.5 With a test pack that has no `aa_keyboard.txt`, fonts + i18n + audio still preload successfully
- [ ] 10.6 Screen reader (TalkBack) announces progress label changes on Android
- [ ] 10.7 `openspec validate loading-screen --strict` passes
- [ ] 10.8 `npx tsc --noEmit` passes
