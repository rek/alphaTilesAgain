# Yue Syllable Game Specification

## Purpose
TBD - imported from archived change. Update Purpose after archive.

## Requirements

### Requirement: Syllable-audio splitting tool

The repo SHALL provide `tools/split-syllable-audio.ts`, a build tool that produces one isolated-syllable audio clip per unique Chinese character in the `yue` pack from the existing `audio/words/` recordings, using `ffmpeg` for silence detection and cutting.

#### Scenario: Tool produces one clip per unique character

- **GIVEN** `languages/yue/aa_wordlist.txt` lists 102 words covering 151 unique Chinese characters
- **AND** every word has a recording at `languages/yue/audio/words/<englishLwc>.mp3`
- **WHEN** `tools/split-syllable-audio.ts` is run
- **THEN** `languages/yue/audio/syllables/` contains exactly 151 mp3 files, one named `<char>.mp3` per unique character
- **AND** every produced clip is non-empty

#### Scenario: Single-character words are sourced verbatim

- **GIVEN** a Chinese character that is itself a one-character word in `aa_wordlist.txt`
- **WHEN** the tool selects that character's source
- **THEN** the character's clip is taken from that word's `audio/words/` recording rather than cut from a multi-character word

#### Scenario: Multi-character words are split at detected silence

- **GIVEN** an `N`-character word whose recording has exactly `N-1` interior silence gaps detected by `ffmpeg silencedetect`
- **WHEN** the tool splits that recording
- **THEN** it produces `N` pieces cut at the midpoints of the detected gaps
- **AND** each piece has leading and trailing silence trimmed

#### Scenario: Low-confidence splits fall back to equal-duration division

- **GIVEN** an `N`-character word whose recording does not yield exactly `N-1` interior silence gaps
- **WHEN** the tool splits that recording
- **THEN** it divides the recording into `N` equal-duration pieces
- **AND** records the word in the review report as an `equal-duration` entry

#### Scenario: Tool emits a review report

- **WHEN** the tool finishes
- **THEN** it writes `tools/data/yue-syllable-cuts/review-report.json` listing, per character, its source word, selection tier, and split path
- **AND** prints a stdout summary that explicitly lists every character whose clip used the equal-duration fallback

### Requirement: `yue` pack ships a complete syllable dataset

The `yue` language pack SHALL contain a populated `aa_syllables.txt` and a matching `audio/syllables/` directory such that every syllable row resolves to a non-empty audio file.

#### Scenario: Syllable index has one row per unique character

- **WHEN** `languages/yue/aa_syllables.txt` is parsed by `parseSyllables`
- **THEN** it yields 151 rows
- **AND** each row's `Syllable` and `SyllableAudioName` are the same raw Chinese character
- **AND** each row's `Duration` is a positive integer (milliseconds)

#### Scenario: Every syllable row has its audio file

- **GIVEN** `aa_settings.txt` has `Has syllable audio` set to `TRUE`
- **WHEN** the lang-pack validator runs `checkAudioReferences` against the `yue` pack
- **THEN** every `aa_syllables.txt` row's `SyllableAudioName` resolves to a file in `audio/syllables/`
- **AND** no `MISSING_SYLLABLE_AUDIO`, `ZERO_BYTE_AUDIO_FILE`, or `ORPHAN_AUDIO_FILE` issue is raised for syllables

#### Scenario: Manifest generation picks up syllable audio

- **WHEN** `tools/generate-lang-manifest.ts` runs for `APP_LANG=yue`
- **THEN** the generated manifest's `audio.syllables` map has 151 entries keyed by the raw Chinese character
- **AND** no change to `tools/generate-lang-manifest.ts` was required

### Requirement: `yue` pack exposes a syllable-game door

The `yue` pack SHALL define one game door that launches the Georgia class in syllable mode at the entry-level challenge.

#### Scenario: Door row launches Georgia syllable mode

- **GIVEN** `languages/yue/aa_games.txt` has a row with `Country=Georgia`, `ChallengeLevel=1`, `SyllOrTile=S`
- **WHEN** the game menu is built by `useDoors`
- **THEN** a door appears with `classKey='georgia'` and `challengeLevel=1`
- **AND** selecting it routes to `apps/alphaTiles/app/games/georgia.tsx` with `doorIndex` set to the row's 1-based index
- **AND** `GeorgiaContainer` resolves `syllableGame='S'` by reading `assets.games.rows[doorIndex - 1].syllOrTile`

#### Scenario: Syllable door is a six-choice round

- **GIVEN** the syllable-game door has `ChallengeLevel=1`
- **WHEN** a round starts in `GeorgiaContainer` S-mode
- **THEN** the round renders 6 choice tiles drawn from the shuffled syllable pool

### Requirement: `aa_wordlist.txt` is not modified

The syllable game SHALL function without adding `.` syllable markers to the Language-of-Play column of `aa_wordlist.txt`.

#### Scenario: Greedy parser segments undotted words

- **GIVEN** `aa_wordlist.txt` Language-of-Play entries contain no `.` markers
- **WHEN** `parseWordIntoSyllables` runs against a `yue` word and the 151-row syllable list
- **THEN** the word is fully segmented into its constituent single-character syllables

#### Scenario: Syllable coherence check stays inactive

- **WHEN** the lang-pack validator runs against the `yue` pack
- **THEN** `checkSyllablesCoherence` emits the informational `SYLLABLES_SKIPPED` issue
- **AND** raises no error-severity issue
