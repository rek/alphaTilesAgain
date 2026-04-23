## ADDED Requirements

### Requirement: Single audio library

The codebase SHALL expose audio via exactly one library, `libs/alphaTiles/data-audio`. No other library — feature, ui, or otherwise — is permitted to import `expo-audio`. Enforced by NX tag rules.

#### Scenario: Feature lib imports expo-audio directly

- **WHEN** a `type:feature` library adds an `import { Audio } from 'expo-audio'`
- **THEN** the build fails at the lint step with an `@nx/enforce-module-boundaries` violation pointing at `data-audio` as the only allowed importer

#### Scenario: Feature lib imports useAudio

- **WHEN** a `type:feature` library imports `useAudio` from `@alphaTiles/data-audio`
- **THEN** the lint passes and the hook resolves to playback functions keyed by pack id

### Requirement: Preload blocks on loading screen

`preloadAudio(manifest, audioConfig, baseChimes)` SHALL return a Promise that resolves only after every referenced audio file has been loaded into an `expo-audio` sound handle (or recorded as a null handle after a per-file error log). The loading screen MUST await this Promise before mounting the app.

#### Scenario: All clips load successfully

- **WHEN** `preloadAudio` is called with a valid manifest containing 70 tiles, 130 words, 0 syllables, 20 instructions, plus the 3 base chimes
- **THEN** the returned `AudioHandles` has a tiles map of size 70, words of 130, syllables of 0, instructions of 20, and chimes populated, and the Promise resolves after the last handle finishes loading

#### Scenario: One pack file is missing

- **WHEN** the manifest references `words/missing.mp3` but the file is absent
- **THEN** preloadAudio logs a single warning naming the missing file, records `null` for that key, and resolves (does not reject) so the rest of the app can boot

#### Scenario: Bounded preload concurrency

- **WHEN** the manifest has 200 audio entries
- **THEN** `preloadAudio` runs at most 8 `createAsync` calls concurrently (bounded to avoid iOS resource limits)

### Requirement: Settings-gated preload of tiles and syllables

When `audioConfig.hasTileAudio === false`, `preloadAudio` SHALL skip loading tile audio entirely and the resulting `tiles` handle map SHALL be empty. Same rule for `hasSyllableAudio === false` and the `syllables` map. Calls to `playTile(id)` / `playSyllable(id)` against an empty map MUST be no-ops that emit one dev-mode warning per unique id and never throw.

#### Scenario: Pack without tile audio

- **WHEN** `aa_settings.txt` has `Has tile audio = FALSE` and `playTile('a')` is called
- **THEN** the call resolves as a no-op, a warning is logged exactly once for id `'a'` in `__DEV__` mode, and no error is thrown

#### Scenario: Pack with tile audio

- **WHEN** `aa_settings.txt` has `Has tile audio = TRUE` and `playTile('a')` is called with `'a'` preloaded
- **THEN** the clip plays and no warning is emitted

### Requirement: Hook API surface

`useAudio()` SHALL return an object containing `playTile`, `playWord`, `playSyllable`, `playInstruction`, `playCorrect`, `playIncorrect`, `playCorrectFinal`, `getTileDuration`, `getWordDuration`, `getSyllableDuration`, `isAudioUnlocked`, and `unlockAudio`. All `play*` methods MUST return `Promise<void>` and MUST swallow per-call errors internally (logging, never throwing).

#### Scenario: Tap handler calls playTile

- **WHEN** a tile-tap handler calls `playTile('a')` without awaiting
- **THEN** the audio starts playing and the handler continues synchronously

#### Scenario: getTileDuration for preloaded tile

- **WHEN** `getTileDuration('a')` is called after preload
- **THEN** it returns the tile's duration in milliseconds (`number`), cached from `getStatusAsync` at preload

#### Scenario: getTileDuration for unknown tile

- **WHEN** `getTileDuration('nonexistent')` is called
- **THEN** it returns `undefined` and does not throw

### Requirement: Overlapping playback — platform-specific strategy

On iOS and Android, a second call to the same handle's `play` while it is still playing SHALL fire a second voice (multi-instance, matching Android `SoundPool`). On web, the same call SHALL stop the current playback and restart it (single-instance, last-play-wins).

#### Scenario: Native double-tap on a tile

- **WHEN** on iOS or Android, `playTile('a')` is called twice within 50ms
- **THEN** both plays are audible — the second starts while the first is still playing

#### Scenario: Web double-tap on a tile

- **WHEN** on web, `playTile('a')` is called twice within 50ms
- **THEN** the first play is cut off and the second play starts from the beginning

### Requirement: Base chimes ship with app shell, not the pack

The three base chimes (`correct.mp3`, `incorrect.mp3`, `correctFinal.mp3`) SHALL live under `apps/alphaTiles/assets/audio/` and be preloaded alongside pack audio by passing a `baseChimes` parameter to `preloadAudio`. The language manifest MUST NOT reference these files.

#### Scenario: preloadAudio receives base chimes

- **WHEN** `preloadAudio(manifest, audioConfig, baseChimes)` is called
- **THEN** the three chime handles are populated on the returned `AudioHandles.chimes` regardless of pack

#### Scenario: playCorrect plays the base chime

- **WHEN** `playCorrect()` is invoked after preload
- **THEN** `apps/alphaTiles/assets/audio/correct.mp3` plays

### Requirement: Web gesture unlock lifecycle

On `Platform.OS === 'web'`, `isAudioUnlocked` SHALL start `false` and flip to `true` only after `unlockAudio()` resolves, which MUST be invoked from a user-gesture handler. On native platforms, `isAudioUnlocked` SHALL be `true` from the first render and `unlockAudio()` SHALL be a no-op resolver.

#### Scenario: Web boot before unlock

- **WHEN** on web, the app has finished preload but no user gesture has occurred
- **THEN** `isAudioUnlocked` is `false` and the loading screen's tap gate is visible

#### Scenario: Web first tap

- **WHEN** the user taps the web unlock gate, invoking `unlockAudio()`
- **THEN** a zero-volume playback primes the `AudioContext`, the Promise resolves, `isAudioUnlocked` flips `true`, and the app proceeds to the first screen

#### Scenario: Native boot

- **WHEN** on iOS or Android
- **THEN** `isAudioUnlocked` is `true` on first render and the tap gate does not render

### Requirement: iOS silent-switch override

During audio init, the library SHALL call `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` so that playback is audible when the physical silent switch is engaged (literacy app UX — users flip the switch for quiet environments and still expect audio).

#### Scenario: iOS with silent switch on

- **WHEN** the device is iOS, the silent switch is on, and `playTile('a')` is called
- **THEN** the clip is audible through the device speaker at system volume
