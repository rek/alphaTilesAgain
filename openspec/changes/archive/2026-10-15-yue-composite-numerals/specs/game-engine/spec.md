## MODIFIED Requirements

### Requirement: Audio-replay button plays the active reference word

The shell SHALL expose a prominent audio-replay button that, when pressed, speaks the current `refWord` via the shell's `speak({ word: refWord })` (pack speech, including the syllable-chain fallback for unrecorded words). While audio is playing, both the replay button and the mechanic's game buttons MUST be locked against further input; they SHALL re-enable on `onComplete`. This mirrors `GameActivity.playActiveWordClip`'s lock/unlock around `mediaPlayerIsPlaying`.

In-flight speech (a syllable chain's pending steps) SHALL be cancelled via pack speech `stop()` whenever the shell's `setRefWord` starts a new round, when the app goes to background, and when the shell unmounts, so no syllable of a previous word plays afterwards.

#### Scenario: Replay during silence

- **WHEN** no audio is playing and the user taps the replay button
- **THEN** `speak({ word: refWord })` fires, game buttons lock, and they unlock on completion

#### Scenario: Replay during playback

- **WHEN** audio is already playing and the user taps the replay button
- **THEN** the tap is ignored (no overlap, no queue)

#### Scenario: Unrecorded refWord replays as a syllable chain

- **GIVEN** `refWord` is yue `二十` (`zz_20`), which has no word clip, and `二` and `十` have syllable clips
- **WHEN** the user taps the replay button
- **THEN** `二` plays, then `十` after `二`'s duration + 150 ms, and the interaction lock is held until the chain ends

#### Scenario: Round transition cancels a running chain

- **GIVEN** a syllable chain is mid-playback
- **WHEN** the mechanic calls `setRefWord` for the next round
- **THEN** the pending chain steps are cancelled and no syllable of the previous word plays

#### Scenario: Unmount cancels a running chain

- **GIVEN** a syllable chain is mid-playback
- **WHEN** the game unmounts (e.g. back to the menu)
- **THEN** the pending chain steps are cancelled and nothing plays into the torn-down screen
