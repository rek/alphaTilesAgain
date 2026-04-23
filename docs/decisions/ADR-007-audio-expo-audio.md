# ADR-007: Audio via `expo-audio` with Web Best-Effort

**Date**: 2026-04-23
**Status**: Accepted

## Context

AlphaTiles is an audio-heavy app — every tile, word, and syllable has a recording, and gameplay relies on tight sound playback (tap a tile, hear it immediately; overlap with correct/incorrect chimes). The Android original uses `SoundPool` for preloaded low-latency playback.

Our port must:

- Preload hundreds of short clips at app boot.
- Play individual clips on demand, with minimal latency.
- Overlap clips (tile sound + correct chime played simultaneously is common).
- Run on iOS, Android, **and web**.
- Not depend on deprecated Expo or React Native modules.

Web adds a specific wrinkle: the Web Audio API requires a user-gesture unlock before any audio plays, and cross-browser handling of overlapping `<audio>` elements is inconsistent.

## Decision

`expo-audio` is the audio engine. It is wrapped by `libs/alphaTiles/data-audio`, which exposes a platform-uniform API:

```ts
preload(keys: AudioKey[]): Promise<void>
play(key: AudioKey): Promise<void>
stop(key?: AudioKey): Promise<void>
```

Platform-specific behavior sits behind that API:

- **Native (iOS, Android)**: full preload into `expo-audio` sound objects. Overlap supported natively. Latency is SoundPool-equivalent.
- **Web**: best-effort. First user tap on the loading screen unlocks `AudioContext`. Overlapping playback is single-instance per key (if a key is already playing, it restarts). Acceptable for v1.

The audio keys and source refs come from the generated language manifest (ADR-003), so preload receives typed source handles, not path strings.

## Rationale

`expo-audio` is the current first-party Expo audio module. It is cross-platform, actively maintained, and designed to replace the deprecated `expo-av`. Wrapping it in a single `libs/alphaTiles/data-audio` library means feature code sees one API regardless of platform; platform differences hide inside the wrapper.

The web caveat is not a limitation we can engineer around — it's a browser policy. Surfacing it as a "tap to start" screen at app launch (shown only on web) is the standard workaround and matches how the user's first interaction already looks on native (loading screen → first tile).

### Pros

- First-party, current Expo module — no deprecation risk.
- Native performance matches Android original.
- Web support keeps the build-one-get-three promise (iOS + Android + web from the same code).
- Wrapper in `data-audio` gives us a one-file place to handle platform forks or to swap the engine later.
- Preload fits cleanly into the existing loading-screen boot step.

### Cons

- Web audio latency is higher than native; best-effort overlap is imperfect (a rapid double-tap on the same tile may cut off itself).
- `expo-audio` is newer than `expo-av`; some community wisdom still references the older module.
- First-tap unlock on web is a visible UX element on that platform only.

## Alternatives Considered

### Alternative 1: `expo-av`

The older Expo audio module.

- **Why not**: Deprecated in favor of `expo-audio`. Taking on a deprecated dependency at the start of a port is a guaranteed future migration.

### Alternative 2: `react-native-sound`

Community library with mature native implementations.

- **Why not**: No web support. Would force us to fork between native and web audio implementations, or drop web entirely. Also requires manual linking outside Expo managed workflow.

### Alternative 3: Skip web — native-only build

Target only iOS and Android, use the best native audio lib.

- **Why not**: Web parity is a project goal (literacy tool accessible on school Chromebooks, shared family computers, etc.). Gating the project on native-only would exclude a meaningful audience.

### Alternative 4: Custom `AudioContext` + Web Audio API direct

Hand-roll native via `expo-modules-core` and web via raw Web Audio.

- **Why not**: Reinvents `expo-audio`. No clear win for our use case (short pre-recorded clips). Unnecessary complexity.

## Consequences

### Positive

- `libs/alphaTiles/data-audio` is the **only** library that imports `expo-audio`. Feature code stays platform-agnostic.
- Preload runs once, during the loading screen. Post-preload, play is synchronous-ish (`expo-audio` handles at module boundary).
- Web tap-to-unlock is a component on the loading screen; other screens never think about it.
- The base sounds (`correct`, `incorrect`, `correctFinal`) use the same API, just sourced from `apps/alphaTiles/assets/audio/` rather than the pack.

### Negative

- Web dev must test gesture-unlock flow. Headless / CI web smoke tests need to simulate the tap.
- Any future audio feature (volume normalization, pitch shift) must be checked for web support or gracefully degraded.

### Neutral

- `docs/ARCHITECTURE.md` §8 documents the audio boundaries.
- Unit tests for the wrapper mock `expo-audio`; integration tests exercise real playback only manually.

## Implementation Notes

- `libs/alphaTiles/data-audio` is `type:data-access`, `scope:alphaTiles`.
- Single module-level `Map<AudioKey, SoundHandle>` caches preloaded sounds. Keys mirror manifest keys.
- `preload()` iterates the current pack's audio keys from `langManifest` and loads all handles in parallel (bounded concurrency — say 8 at a time — to avoid iOS resource limits).
- `play(key)`:
  - Native: call `sound.replayAsync()` on the cached handle. Fire-and-forget.
  - Web: if already playing, `sound.stop()` then `sound.play()`. Best-effort overlap.
- `stop(key?)`: targeted or all.
- Web first-tap unlock: a `WebAudioUnlock` component renders on the loading screen (`Platform.OS === 'web'`) as a full-screen tap target; on tap, plays a zero-volume ping to satisfy the browser policy, then signals ready.
- Base sounds live at `apps/alphaTiles/assets/audio/` and are bundled into the app shell, not the pack. They're preloaded alongside pack audio.

## References

- `docs/ARCHITECTURE.md` §8 (audio)
- `expo-audio` docs
- MDN — Web Audio API autoplay policy
- ADR-003 (asset bundling) — where audio keys come from
- ADR-001 (per-language build) — why every build has a known audio key set
