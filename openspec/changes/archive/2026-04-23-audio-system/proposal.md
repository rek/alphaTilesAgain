## Why

Every game in AlphaTiles is audio-first — tapping a tile must play its phoneme within a human-perceptible tap-to-sound window, words and syllables must play on demand, and correctness chimes overlap with tile playback every round. The Android original preloads hundreds of clips into `SoundPool` at `Start.java` boot so playback is synchronous from the game's perspective (Start.java §140-200). Our port needs the same guarantee on native, a best-effort equivalent on web (ADR-007), and a single typed API that every game feature library consumes without touching `expo-audio` directly.

No audio library exists yet. `feature-game-shell`, `feature-game-china`, `loading-screen`, and `data-language-assets` all depend on this change before any tile-tap playback can ship.

## What Changes

- Add `libs/alphaTiles/data-audio` (`type:data-access`, `scope:alphaTiles`) — the sole library allowed to import `expo-audio`.
- Expose `preloadAudio(manifest): Promise<AudioHandles>` — called once by the loading screen after the language manifest is available.
- Expose `useAudio()` hook — returns `playTile(id)`, `playWord(id)`, `playSyllable(id)`, `playInstruction(id)`, `playCorrect()`, `playIncorrect()`, `playCorrectFinal()`, `isAudioUnlocked`, `unlockAudio()`.
- Ship base chimes (`correct.mp3`, `incorrect.mp3`, `correctFinal.mp3`) under `apps/alphaTiles/assets/audio/` and wire them into a static module constant — NOT the language manifest.
- Gate tile / syllable preload on `aa_settings.txt` flags `Has tile audio` and `Has syllable audio` — when false, `preloadAudio` skips those maps and the corresponding `play*` calls are no-ops with a single dev-mode warning.
- Cache each clip's duration as `expo-audio` exposes it; expose `getTileDuration(id): number | undefined` for downstream use in timed drills.
- Web gesture unlock: expose `isAudioUnlocked` flag + `unlockAudio()` call so the loading screen can gate mount on first tap on `Platform.OS === 'web'`.
- Add `expo-audio` as a new dependency in `apps/alphaTiles/package.json`.

## Capabilities

### New Capabilities

- `audio`: keyed preload of pack-sourced audio (tiles, words, syllables, instructions) + shared chimes; a single `useAudio()` API exposing per-category playback methods; web gesture-unlock lifecycle; per-clip duration cache.

### Modified Capabilities

_None_ — first audio-bearing change.

## Impact

- **New lib**: `libs/alphaTiles/data-audio/` (source, project.json, unit tests).
- **New files**: `apps/alphaTiles/assets/audio/correct.mp3`, `incorrect.mp3`, `correctFinal.mp3` (copied from shared source — not pack-sourced).
- **New dep**: `expo-audio` in `apps/alphaTiles/package.json`. No other lib is allowed to import it.
- **Downstream unblocks**: `loading-screen` (calls `preloadAudio` + `unlockAudio`), `feature-game-shell` (calls `useAudio` for playback + chimes), `feature-game-china` (tile tap playback).
- **No breaking changes** — additive.
- **Risk: web gesture unlock interacts poorly with automated e2e** — tests must simulate a tap before any audio assertion. Documented in design.
