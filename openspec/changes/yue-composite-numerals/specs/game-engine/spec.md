## MODIFIED Requirements

### Requirement: Audio-replay button plays the active reference word

The shell SHALL expose a prominent audio-replay button that, when pressed, plays the current `refWord` using `useAudio().playWord`. While audio is playing, both the replay button and the mechanic's game buttons MUST be locked against further input; they SHALL re-enable on `onComplete`. This mirrors `GameActivity.playActiveWordClip`'s lock/unlock around `mediaPlayerIsPlaying`.

When `refWord` has no per-word audio handle (i.e. `useAudio().getWordDuration(refWord.wordInLWC)` returns `undefined`) but `refWord.wordInLOP` fully decomposes into known syllables via `parseWordIntoSyllables`, the shell SHALL play each constituent syllable's clip in sequence via `useAudio().playSyllable`, separated by a `GAP_MS` natural pause and scheduled via a `setTimeout` timer-ref (not chained promises — `audio.playSyllable` resolves on playback *start*, not end). The timer-ref MUST be cleared at the top of every `startRound` and on container unmount.

If `refWord` has neither word audio nor a full syllable decomposition, the replay button SHALL be a no-op (existing missing-handle warn-once behavior).

#### Scenario: Replay during silence with word audio present

- **WHEN** no audio is playing, `audio.getWordDuration(refWord.wordInLWC)` returns a positive number, and the user taps the replay button
- **THEN** `useAudio().playWord(refWord.wordInLWC)` fires, game buttons lock, and they unlock on completion

#### Scenario: Replay during playback

- **WHEN** audio is already playing and the user taps the replay button
- **THEN** the tap is ignored (no overlap, no queue)

#### Scenario: Replay falls back to syllable chain when word audio is absent

- **GIVEN** `refWord.wordInLOP` is `"二十"` and `audio.handles.words.get('zz_20')` returns `undefined`
- **AND** `audio.handles.syllables.get('二')` and `audio.handles.syllables.get('十')` both return valid handles
- **WHEN** the user taps the replay button
- **THEN** `audio.playSyllable('二')` fires immediately, game buttons lock
- **AND** after `audio.getSyllableDuration('二') + GAP_MS` ms, `audio.playSyllable('十')` fires via a `setTimeout` timer-ref
- **AND** after the second syllable's duration completes, game buttons unlock

#### Scenario: Replay no-op when neither word audio nor decomposition resolves

- **GIVEN** `refWord.wordInLOP = "未知"` and neither `audio.handles.words.get(lwc)` nor `parseWordIntoSyllables("未知", syllables)` resolves (chars not in syllable list)
- **WHEN** the user taps the replay button
- **THEN** the existing warn-once dev-mode message fires
- **AND** no audio plays
- **AND** game buttons stay unlocked (the round continues)

#### Scenario: Timer-ref cleared on round transition

- **GIVEN** a syllable chain is mid-playback (first syllable played, second scheduled via timer-ref)
- **WHEN** `startRound` is called (e.g. correct answer triggers next round)
- **THEN** the pending `setTimeout` is cleared
- **AND** no orphan syllable from the previous word plays after the new round begins

#### Scenario: Timer-ref cleared on container unmount

- **GIVEN** a syllable chain is mid-playback
- **WHEN** the game container unmounts (e.g. back button to menu)
- **THEN** the pending `setTimeout` is cleared in the unmount cleanup
- **AND** no orphan syllable plays into a torn-down container
