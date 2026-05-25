## ADDED Requirements

### Requirement: Replacement Syllable Audio For Twelve Yue Characters

The `yue` language pack SHALL ship hand-recorded single-syllable audio (supplied by the language community per issue #27) for the first 12 characters in the Taiwan writing-game's stroke-count-sorted rotation: `人 士 女 丈 大 上 下 工 小 叉 公 夫`. Each file SHALL live at `languages/yue/audio/syllables/<char>.mp3`, overwriting the auto-`silencedetect`-cut clip shipped by the archived `yue-syllable-game` change. The destination filename SHALL be exactly the character (e.g. `女.mp3`), with no index prefix or whitespace.

The 13th sort-position character (`手`) SHALL remain on its existing auto-cut clip pending customer confirmation on issue #27 of whether they intend to re-record it.

#### Scenario: All 12 customer-supplied files land at the expected destination paths
- **GIVEN** the customer has supplied 12 mp3 files in a bundle with index-prefixed filenames
- **WHEN** the change is applied
- **THEN** `languages/yue/audio/syllables/人.mp3`, `士.mp3`, `女.mp3`, `丈.mp3`, `大.mp3`, `上.mp3`, `下.mp3`, `工.mp3`, `小.mp3`, `叉.mp3`, `公.mp3`, and `夫.mp3` each contain the bytes of the corresponding customer-supplied file
- **AND** none of those filenames contain leading whitespace, trailing whitespace, or an index prefix
- **AND** `手.mp3` is unchanged from its pre-change state

#### Scenario: Validator accepts the asset swap
- **GIVEN** the 12 files have been overwritten
- **WHEN** `APP_LANG=yue tools/validate-lang-pack.ts` runs
- **THEN** it reports zero errors
- **AND** `checkAudioReferences` confirms every `aa_syllables.txt` row resolves to a non-empty file

#### Scenario: Manifest counts unchanged from HEAD
- **GIVEN** the 12 files have been overwritten
- **WHEN** `APP_LANG=yue tools/generate-lang-manifest.ts` runs
- **THEN** `apps/alphaTiles/src/generated/langManifest.ts` shows zero diff
- **AND** the syllables / words / tiles counts remain at the HEAD baseline (163 / 114 / 116 — the post-`yue-numerals-game` state)

### Requirement: Taiwan Plays Syllable Audio With Compound-Word Fallback

The Taiwan writing game SHALL resolve audio for the current practice character — used both on character completion in `handleCharComplete` and on repeat-button press in `onRepeat` — via a pure helper `pickAudioForChar` whose decision tree is:

1. If `assets.audio.syllables[currentChar]` is defined (i.e. the pack shipped a syllable row for that character), return `{ kind: 'syllable', char: currentChar }`. The container SHALL invoke `audio.playSyllable(currentChar)`.
2. Otherwise, if `taiwanData.audioForChar[currentChar]` is defined (the compound-word fallback built by `buildTaiwanData`), return `{ kind: 'word', lwc }`. The container SHALL invoke `audio.playWord(lwc)`.
3. Otherwise, return `{ kind: 'none' }`. The container SHALL play no audio and not throw.

The `syllables[char]` check is a **pack-shipped** predicate (every `aa_syllables.txt` row contributes a key), NOT a **runtime-loaded** predicate. Runtime audio-load failures are handled silently by `playSyllable`'s existing no-op-with-`__DEV__`-warn behaviour, identical to `playWord`'s handling of failed word loads — both call sites share symmetric edge cases.

The pure helper SHALL live at `libs/alphaTiles/feature-game-taiwan/src/pickAudioForChar.ts` (one function per file per `docs/CODE_STYLE.md`), with a co-located unit test covering all three branches.

#### Scenario: Syllable audio plays when the pack ships it
- **GIVEN** the current practice character is `女`
- **AND** `assets.audio.syllables['女']` is defined (i.e. `aa_syllables.txt` has a `女` row and `audio/syllables/女.mp3` exists)
- **WHEN** the player finishes tracing `女` OR presses the repeat button
- **THEN** `audio.playSyllable('女')` is invoked
- **AND** `audio.playWord` is NOT invoked

#### Scenario: Compound-word fallback plays when no syllable audio is shipped
- **GIVEN** the current practice character is `醫`
- **AND** `assets.audio.syllables['醫']` is undefined (the pack ships no `aa_syllables.txt` row for `醫`)
- **AND** `taiwanData.audioForChar['醫']` is `'doctor'` (the LWC key for the first compound `醫生`)
- **WHEN** the player finishes tracing `醫` OR presses the repeat button
- **THEN** `audio.playWord('doctor')` is invoked
- **AND** `audio.playSyllable` is NOT invoked

#### Scenario: No audio when neither source exists
- **GIVEN** the current practice character is `X` (hypothetical)
- **AND** `assets.audio.syllables['X']` is undefined
- **AND** `taiwanData.audioForChar['X']` is undefined
- **WHEN** the player finishes tracing `X` OR presses the repeat button
- **THEN** neither `audio.playSyllable` nor `audio.playWord` is invoked
- **AND** no exception is thrown

#### Scenario: Yue build always takes the syllable path
- **GIVEN** the active pack is `yue` (which has `Has syllable audio: TRUE` and validator-enforced full syllable coverage)
- **WHEN** the player completes any character `currentChar` in a Taiwan door
- **THEN** `pickAudioForChar` always returns `{ kind: 'syllable', char: currentChar }`
- **AND** the compound-word fallback is unreachable for the yue build (correct dead code; required for pack-agnostic behaviour)

#### Scenario: Pure helper is testable without rendering the container
- **GIVEN** a unit test file at `libs/alphaTiles/feature-game-taiwan/src/pickAudioForChar.test.ts`
- **WHEN** the test imports `pickAudioForChar` and invokes it with three fixture inputs covering the syllable / word / none branches
- **THEN** each invocation returns the expected discriminated-union variant
- **AND** the test does not render any React component or stub `useAudio`
