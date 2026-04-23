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

- [ ] 1.1 Generate `libs/alphaTiles/data-audio` via `nx g @nx/js:lib data-audio --directory=libs/alphaTiles/data-audio --tags='type:data-access,scope:alphaTiles'`
- [ ] 1.2 Add `expo-audio` to `apps/alphaTiles/package.json` dependencies
- [ ] 1.3 Add `@nx/enforce-module-boundaries` rule restricting `expo-audio` imports to `data-audio` only
- [ ] 1.4 Verify lint fails when a fixture `type:feature` lib adds `import { Audio } from 'expo-audio'`

## 2. Base chimes asset wiring

- [ ] 2.1 Copy `correct.mp3`, `incorrect.mp3`, `correctFinal.mp3` from the Android source's `res/raw/` into `apps/alphaTiles/assets/audio/`
- [ ] 2.2 Declare `BASE_CHIMES` module constant inside `data-audio` with `require()` calls pointing at `apps/alphaTiles/assets/audio/*.mp3`
- [ ] 2.3 Ensure the language manifest generator does NOT emit entries for these three files

## 3. Types

- [ ] 3.1 Declare `AudioConfig` type — `{ hasTileAudio: boolean; hasSyllableAudio: boolean }`
- [ ] 3.2 Declare `SoundHandle` type as a newtype wrapping `expo-audio.Audio.Sound` (internal only)
- [ ] 3.3 Declare `AudioHandles` shape — `{ tiles, words, syllables, instructions: Map<string, SoundHandle | null>; chimes: { correct, incorrect, correctFinal: SoundHandle } }`
- [ ] 3.4 Infer the hook return via `ReturnType<typeof useAudio>` — no hand-written type file

## 4. Preload

- [ ] 4.1 Implement `preloadAudio(manifest, audioConfig, baseChimes)`:
  - [ ] 4.1.1 Call `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` once
  - [ ] 4.1.2 Build category task lists from manifest: `tiles` (skip if !hasTileAudio), `syllables` (skip if !hasSyllableAudio), `words` (always), `instructions` (always)
  - [ ] 4.1.3 Run loaders with concurrency bound of 8 (simple semaphore)
  - [ ] 4.1.4 On per-file error: log `console.warn` naming the file, record null handle, continue
  - [ ] 4.1.5 For each successfully loaded handle, call `getStatusAsync().then(s => s.durationMillis)` and cache in a parallel `Map<string, number>`
  - [ ] 4.1.6 Load the three base chimes in parallel with the rest
- [ ] 4.2 Unit tests against a mocked `expo-audio`:
  - [ ] 4.2.1 Full successful preload with a 5-key tile map → handle map has 5 entries, duration cache has 5 entries
  - [ ] 4.2.2 `hasTileAudio: false` → tile map empty, word map populated
  - [ ] 4.2.3 One failing file → warning logged once, rest succeeds, that key is `null` in the map
  - [ ] 4.2.4 Concurrency bound — if 20 keys, no more than 8 `createAsync` calls are in-flight at any instant

## 5. Provider + hook

- [ ] 5.1 Implement `AudioProvider` that takes `AudioHandles` and exposes them via Context; tracks `isAudioUnlocked` state
- [ ] 5.2 Implement `useAudio()` hook reading from Context:
  - [ ] 5.2.1 `playTile(id)` — lookup handle; if null/missing, warn-once + no-op; native: `replayAsync()` fire-and-forget; web: `stop()` then `play()`
  - [ ] 5.2.2 `playWord(id)` — same pattern
  - [ ] 5.2.3 `playSyllable(id)` — same pattern + settings-gate warn
  - [ ] 5.2.4 `playInstruction(id)` — same pattern
  - [ ] 5.2.5 `playCorrect` / `playIncorrect` / `playCorrectFinal` — same pattern against `chimes`
  - [ ] 5.2.6 `getTileDuration` / `getWordDuration` / `getSyllableDuration` — read from duration caches
  - [ ] 5.2.7 `unlockAudio()` — web only, zero-volume chime primer, set unlocked flag
- [ ] 5.3 Warn-once dedupe: module-level `Set<string>` of warned ids per category
- [ ] 5.4 Unit tests:
  - [ ] 5.4.1 `playTile` with preloaded handle → handle's `replayAsync`/`play` called once
  - [ ] 5.4.2 `playTile` with missing id → warn called once (subsequent calls silent), no throw
  - [ ] 5.4.3 Settings-disabled tile audio → `playTile('a')` warns once and returns
  - [ ] 5.4.4 `getTileDuration('a')` after preload returns cached number; unknown id returns undefined
  - [ ] 5.4.5 `unlockAudio` on native short-circuits (no-op), on web flips flag after priming
  - [ ] 5.4.6 Double-tap on web → `stop()` called before `play()` on second tap
  - [ ] 5.4.7 Double-tap on native → `replayAsync()` called twice, no `stop()`

## 6. Loading-screen integration (stub here, full wiring in `loading-screen` change)

- [ ] 6.1 Export a minimal contract from `data-audio`: `preloadAudio`, `AudioProvider`, `useAudio`, `isAudioUnlocked` selector
- [ ] 6.2 Add an exported `<WebAudioUnlockGate>` component that renders children only when `isAudioUnlocked` (identity on native)
- [ ] 6.3 Storybook story for `<WebAudioUnlockGate>` with a mocked context showing locked + unlocked states

## 7. Validation

- [ ] 7.1 `openspec validate audio-system` passes
- [ ] 7.2 `npx tsc --noEmit` passes across workspace
- [ ] 7.3 Manual smoke: `APP_LANG=eng nx start alphaTiles` boots, loading screen preloads, first tile-tap plays (once loading-screen change lands)
- [ ] 7.4 Manual web smoke: `nx web-export alphaTiles && bunx serve` → tap gate shows, first tap unlocks, subsequent tile plays work
