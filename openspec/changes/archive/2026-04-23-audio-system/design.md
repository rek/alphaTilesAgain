## Context

The Android source uses a single static `SoundPool` instance built at `Start.onCreate()` (Start.java:154), then preloads every tile, word, syllable, and instruction mp3 inside the loading flow (`LoadingScreen.java` kicks off the preload and waits on a monotone counter of loaded sound IDs). Games call `gameSounds.play(soundId, …)` synchronously from tap handlers — the latency is SoundPool-low because every clip is resident.

Our port targets the same UX on native and degrades on web per ADR-007. The audio library is therefore:

1. The only module in the codebase that imports `expo-audio`.
2. Preload-blocking at the loading screen — same as Android's `SoundPool` boot.
3. A single `useAudio()` API, stable across platforms, that every game feature consumes.
4. Branching on `aa_settings.txt` flags at preload time so packs that don't ship tile audio (or syllable audio) don't spend boot time on missing files.

Non-string pack data is **not** routed through i18next (ARCHITECTURE.md §6) — audio handles live here. The language manifest (ADR-003, emitted by `generate-lang-manifest.ts`) gives us static `require()` handles keyed by id; we hand those to `expo-audio` at preload and keep the resulting sound handles in a module-level `Map`.

### Required reading for implementers

- `AGENTS.md` — entry doc; read first.
- `openspec/AGENT_PROTOCOL.md` — pickup protocol.
- `docs/ARCHITECTURE.md` §6 (runtime data flow — audio is not in the i18n pipeline), §8 (audio section).
- `docs/decisions/ADR-007-audio-expo-audio.md`, `ADR-003-asset-bundling-via-generated-manifest.md`.
- **Upstream OpenSpec changes (must be merged before starting):**
  - `lang-assets-runtime` — supplies `LangAssets.audio` keyed handles and `useLangAssets()` hook.
  - Transitively: `port-foundations`, `lang-pack-parser`.
  - Read `openspec/changes/lang-assets-runtime/design.md` in full.
- **Source Java files being ported** (absolute paths):
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Start.java` (~lines 150–220, `SoundPool` setup) — the SoundPool instance the TS port replaces.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/LoadingScreen.java` — preload orchestration; counter-driven "ready" gate.
  - `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/GameActivity.java` — the callers: `playTileAudio`, `playWordAudio`, etc.
- **Fixture paths** (absolute, under `../PublicLanguageAssets/`):
  - `../PublicLanguageAssets/engEnglish4/res/raw/zz_*.mp3` (tile audio), `*.mp3` (word audio), `zzz_*.mp3` (instructions).
  - `../PublicLanguageAssets/engEnglish4/res/raw/aa_settings.txt` — tile-audio / syllable-audio feature flags.
  - `../PublicLanguageAssets/tpxTeocuitlapa/res/raw/*.mp3` + `aa_settings.txt` — confirm preload skips unused categories.

## Goals / Non-Goals

**Goals:**

- Tap-to-sound latency on native matches SoundPool (sub-50ms typical).
- `useAudio()` callers never branch on `Platform.OS` — the wrapper hides it.
- Preload completes during the loading screen; no lazy loads during gameplay.
- `playTile('a')` with no audio configured emits one dev-mode warning and returns silently — never throws.
- Per-clip duration is cached at preload for any caller that needs it (e.g. word-reveal timing in future games).
- Web first-interaction gesture unlock is the loading screen's responsibility but is implemented behind `unlockAudio()` exposed from this lib.
- `expo-audio` is swappable — a future engine change is a one-file edit inside this lib.

**Non-Goals:**

- Hot-reload of audio during dev. A pack swap requires a Metro restart (same as any asset change).
- Volume normalization, pitch shift, EQ — not in the Android original, not in v1.
- Background music / ambient audio — none in the original.
- Haptics coupling — `expo-audio` only. Haptics are a separate concern.
- Android ducking / focus management beyond `expo-audio` defaults.
- Real e2e coverage of web gesture unlock. Manual smoke test is sufficient for v1.
- Partial preload (lazy-load on first use). Android preloads everything; we match that for consistency (see D3).

## Decisions

### D1. `expo-audio` over `expo-av`

Per ADR-007: `expo-av` is deprecated in favor of `expo-audio`. Starting a port on a deprecated library is a guaranteed future migration. Cons: community docs still reference `expo-av`; newer API surface means less Stack Overflow coverage. Accepted — the migration cost we'd pay later dwarfs the ramp-up cost now.

### D2. Keyed map, not a flat list

Every preloaded handle is stored under its id (tile id, word id, syllable id, instruction name):

```ts
type AudioHandles = {
  tiles: Map<string, SoundHandle>;   // 'a' → handle
  words: Map<string, SoundHandle>;   // 'act' → handle
  syllables: Map<string, SoundHandle>;
  instructions: Map<string, SoundHandle>;
  chimes: { correct: SoundHandle; incorrect: SoundHandle; correctFinal: SoundHandle };
};
```

Keys come from the language manifest (ADR-003) — the manifest's `audio.tiles['a']` resolves to a `require()` number, which the wrapper feeds to `expo-audio.Audio.Sound.createAsync`. Ids match the keys used by the parser downstream; no translation layer needed at call sites.

Alternative: flat array indexed by `audioId`. Rejected — the Android pattern (`soundIDs: Map<String, Integer>`) is already keyed; keeping parity saves translation code.

### D3. Preload-blocking at loading screen

`preloadAudio(manifest)` returns a Promise that resolves when every handle is ready (or errored with a per-file log and a recorded null handle). The loading screen awaits this before mounting the app. Reasons:

- Android's `SoundPool` is effectively preload-blocking — `onLoadComplete` is awaited there too.
- Lazy loading inside a tap handler adds first-tap latency on every unique clip — unacceptable UX.
- The memory cost (hundreds of short mp3s, each a few KB to tens of KB) is well within Asset reference limits on all platforms. `expo-audio` holds the Asset, which is memory-mapped on native; web keeps an `<audio>` per key.

Concurrency: preload in parallel with a bound of **8 simultaneous loads** to avoid iOS resource limits (per ADR-007 implementation notes).

### D4. Overlapping playback policy

- **Native** (iOS, Android): `expo-audio` multi-instance playback. Calling `play` on a handle that's already playing fires a second voice — exactly the Android `SoundPool` behavior (tile sound + correct chime layered).
- **Web**: single-instance per key. The same handle's `play()` stops itself first (`lastPlayWins`). Cross-key overlap (tile + chime) still works because they're different handles.

Call sites do not branch — the wrapper implements both strategies under one `play` method. Web single-instance is a known degradation, called out in ADR-007.

### D5. Base chimes ship with the app, not the pack

`correct.mp3`, `incorrect.mp3`, `correctFinal.mp3` live at `apps/alphaTiles/assets/audio/`. They are preloaded alongside pack audio by passing a second parameter (`baseChimes`) to `preloadAudio`. Reasons:

- Identical across packs — zero reason to duplicate into each `languages/<code>/audio/`.
- `apps/alphaTiles/assets/` is inside the Expo bundle; guaranteed present.
- Matches ADR-007 Implementation Notes.

These chimes are referenced via a module-local `BASE_CHIMES` constant:

```ts
const BASE_CHIMES = {
  correct: require('../../../apps/alphaTiles/assets/audio/correct.mp3'),
  incorrect: require('../../../apps/alphaTiles/assets/audio/incorrect.mp3'),
  correctFinal: require('../../../apps/alphaTiles/assets/audio/correctFinal.mp3'),
} as const;
```

(Path resolved inside the lib — this is the one place `data-audio` reaches into `apps/`, justified because base chimes are an app-level asset by definition.)

### D6. Settings-gated preload

`preloadAudio(manifest)` reads the parsed `aa_settings.txt` values (delivered alongside the manifest via the `AudioConfig` input):

```ts
type AudioConfig = {
  hasTileAudio: boolean;
  hasSyllableAudio: boolean;
};
```

When `hasTileAudio === false`, the `tiles` map is empty after preload. `playTile(id)` is then a no-op that emits a single dev-mode warning per unique id (`__DEV__ && console.warn(...)`) to catch misuse while never throwing in production. Same rule for syllables. `words` and `instructions` are always expected (every pack has them).

### D7. Duration cache

`expo-audio`'s `AudioSource`/loaded `Audio.Sound` exposes `getStatusAsync().then(s => s.durationMillis)`. We call that at preload time and cache into a parallel `Map<string, number>` per category. `getTileDuration('a')` returns `number | undefined` (undefined = not loaded or not preloaded yet). Exposed from the hook for downstream features that need word-length-based pacing.

Alternative: compute on demand. Rejected — duration is stable for a given file, preload is the natural moment to hydrate.

### D8. Hook surface

```ts
export function useAudio(): {
  playTile: (id: string) => Promise<void>;
  playWord: (id: string) => Promise<void>;
  playSyllable: (id: string) => Promise<void>;
  playInstruction: (id: string) => Promise<void>;
  playCorrect: () => Promise<void>;
  playIncorrect: () => Promise<void>;
  playCorrectFinal: () => Promise<void>;
  getTileDuration: (id: string) => number | undefined;
  getWordDuration: (id: string) => number | undefined;
  getSyllableDuration: (id: string) => number | undefined;
  isAudioUnlocked: boolean;
  unlockAudio: () => Promise<void>;
};
```

- All `play*` return Promises but callers fire-and-forget (void). Await is available for tests.
- `isAudioUnlocked` is `true` on native always; on web it flips `true` after `unlockAudio()` resolves.
- `useAudio` reads from a Context provider (`AudioProvider`) mounted inside the loading screen once preload resolves. Before that, consumers never render.

### D9. Web gesture unlock

The loading screen shows a full-screen tap gate only on `Platform.OS === 'web'`. The gate's onPress calls `unlockAudio()`:

```ts
async unlockAudio() {
  if (Platform.OS !== 'web' || isAudioUnlocked) return;
  // Play a zero-volume 1-frame clip on any handle to prime AudioContext.
  await chimes.correct.setVolumeAsync(0);
  await chimes.correct.replayAsync();
  await chimes.correct.setVolumeAsync(1);
  setIsAudioUnlocked(true);
}
```

Fires the `audio_unlock_web` analytics event (see `analytics-abstraction`). Native platforms short-circuit — `isAudioUnlocked` starts `true`.

### D10. Memory profile

`expo-audio` holds an Asset reference per loaded handle. Assets on native are memory-mapped (not fully resident). On web, each handle is an `HTMLAudioElement` — hundreds of those is fine (Chromium handles thousands). Concrete pack example: `engEnglish4` has ~70 tile clips, ~130 word clips, ~20 instruction clips → 220 handles. Well below any platform limit.

No unload / eviction strategy in v1. Pack-swap at dev time is a Metro restart, which tears down everything.

## Risks / Trade-offs

- **[Risk]** Web gesture unlock timing race — if a game screen mounts before unlock, calling `play()` silently fails (browser blocks it). **Mitigation**: `AudioProvider` only mounts children once `isAudioUnlocked` is true; loading screen gates on that.
- **[Risk]** `expo-audio` API churn in future SDKs — we're on an actively-developed library. **Mitigation**: wrapper isolates the churn. Upgrades are a one-file review.
- **[Risk]** Missing audio file in pack (validator misses, or user edits pack post-rsync) → `createAsync` throws at preload. **Mitigation**: `preloadAudio` catches per-file, records a null handle, logs a warning, and continues. Playback of a null handle is a no-op + warning (same pattern as settings-disabled tiles). Full semantic validation is the validator's job (ADR-008).
- **[Risk]** iOS silent switch — `expo-audio` plays through earpiece when the silent switch is on unless configured otherwise. **Mitigation**: set `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` during `preloadAudio` init (literacy games must play when the switch is flipped — users will flip it for "quiet classroom" and still expect audio).
- **[Trade-off]** Preload-blocking loading screen delays first tile-tap by the preload duration (seconds on poor devices). **Accepted** — matches Android. Loading screen has a progress indicator.
- **[Trade-off]** Web single-instance overlap is imperfect — rapid double-tap of the same tile cuts itself. **Accepted** per ADR-007. Same behavior as HTML audio generally; users expect it.
- **[Trade-off]** Duration cache memory overhead — one `number` per loaded clip (~2KB total for a large pack). **Negligible.**

## Open Questions

- Should `playInstruction` be settings-gated too, or is it always-on? **Defer** — every pack checked so far has instruction audio; if one ships without, we'll revisit with a settings flag.
- Volume per-category (e.g. chimes louder than tiles)? **Defer** — Android original plays everything at `SoundPool` default volume. If user research shows a mix problem, we add a multiplier map.
- `playCorrectFinal()` vs `playCorrect()` on the last tracker — is it the container's call to decide which, or an engine concern? **Container's call** — wrapper just exposes the distinct clips. Documented here; enforced downstream in `feature-game-shell`.
