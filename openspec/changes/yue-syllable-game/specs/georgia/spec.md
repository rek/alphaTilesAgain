# Capability: georgia (modified)

The Georgia syllable mode (S) gains isolated first-syllable playback at round start so the cut per-syllable audio shipped by the `yue-syllable-game` change is actually heard. The tile mode (T) is unchanged.

## MODIFIED Requirements

### Requirement: Round Start Plays Word Audio

When `playAgain` runs, the game SHALL play the active word clip via `audio.playWord(refWord.wordInLWC)`. Java reference: `Georgia.java:161` (`playActiveWordClip(false)`).

In **syllable mode (S) only**, after the word clip the game SHALL additionally play the isolated first-syllable clip via `audio.playSyllable(correctText)`, where `correctText` is the round's correct first-syllable character. The syllable playback SHALL be scheduled after the word clip's duration (from `audio.getWordDuration`, with a constant fallback when the duration is unknown). The scheduling timer SHALL be tracked in a ref and cleared on the next round start and on unmount. Tile mode (T) plays the word clip only, exactly as before.

#### Scenario: Word audio plays at round start

- **WHEN** a new round begins
- **THEN** `audio.playWord(refWord.wordInLWC)` is invoked once

#### Scenario: Syllable mode also plays the isolated first syllable

- **GIVEN** the game is in syllable mode (S)
- **WHEN** a new round begins
- **THEN** `audio.playWord(refWord.wordInLWC)` is invoked once
- **AND** `audio.playSyllable(correctText)` is invoked once after the word clip's duration

#### Scenario: Tile mode is unchanged

- **GIVEN** the game is in tile mode (T)
- **WHEN** a new round begins
- **THEN** `audio.playWord(refWord.wordInLWC)` is invoked once
- **AND** `audio.playSyllable` is not invoked

#### Scenario: Pending syllable playback is cancelled on round change

- **GIVEN** the game is in syllable mode and a syllable playback is scheduled but has not yet fired
- **WHEN** the next round starts or the game unmounts
- **THEN** the scheduled `audio.playSyllable` timer is cleared and does not fire
