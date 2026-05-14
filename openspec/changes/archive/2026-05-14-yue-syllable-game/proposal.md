## Why

The Cantonese (`yue`) pack ships 102 word recordings. In Cantonese one written character is one spoken syllable, so most of those recordings are two-, three-, or four-syllable utterances — `醫生` (doctor) is `醫` + `生`. Beginning learners need to hear those syllables **in isolation** before they can recognise them inside a word, but the pack has no per-syllable audio and `aa_syllables.txt` is an empty header.

The engine already supports syllables end-to-end: `aa_syllables.txt` / `audio/syllables/` are part of the pack schema, the manifest generator scans them, the audio system exposes `playSyllable`, and `feature-game-georgia` has a fully-built syllable mode (S). The only missing pieces are (a) the per-syllable audio, (b) the syllable index file, and (c) a door that launches the game.

## What Changes

- Add `tools/split-syllable-audio.ts` — a build tool that cuts each multi-character `audio/words/*.mp3` clip into per-character pieces using `ffmpeg silencedetect`, deduplicates to one clip per unique character, and emits `languages/yue/audio/syllables/<char>.mp3` plus a generated `languages/yue/aa_syllables.txt`.
- Generate `languages/yue/audio/syllables/` — 151 mp3s, one per unique Chinese character (12 sourced verbatim from single-character word recordings, 139 cut from multi-character recordings).
- Generate `languages/yue/aa_syllables.txt` — 151 rows keyed by the raw character.
- Append one Door row to `languages/yue/aa_games.txt` — Door 9, `Georgia` class, `SyllOrTile = S`, ChallengeLevel 1 (6 choices). The Georgia route already exists.
- Modify `feature-game-georgia` S-mode — after playing the reference word, play the isolated first-syllable clip so the learner hears the sound the round is asking about. T-mode is untouched.

## Capabilities

### New Capabilities

- `yue-syllable-game` — per-syllable audio extraction tooling, the generated `yue` syllable assets, and the syllable-game door wiring.

### Modified Capabilities

- `game-georgia` — S-mode round audio additionally plays the isolated first-syllable clip after the reference word.

## Impact

- New tool `tools/split-syllable-audio.ts` (no runtime code; build/asset tooling).
- New asset files under `languages/yue/audio/syllables/` (151 mp3s) and a populated `languages/yue/aa_syllables.txt`.
- One new row in `languages/yue/aa_games.txt`.
- Additive change to `GeorgiaContainer.tsx`, gated on `isSyllable` — no change to T-mode behaviour, existing Georgia tests, or stories.
- No change to `aa_wordlist.txt`, the manifest generator, the parser, the validator, or the audio system.
- No breaking changes. Other language packs are unaffected; the tool is `yue`-specific.

## Out of Scope

- Distractor (`Or1/Or2/Or3`) curation in `aa_syllables.txt` — left empty; ChallengeLevel 1 draws choices from the shuffled pool and ignores distractor columns.
- Adding `.` syllable markers to `aa_wordlist.txt` — `parseWordIntoSyllables` greedy-matches without them, and adding them would change displayed orthography.
- Higher Georgia challenge levels (12/18 choices) or the hard band for the `yue` syllable game.
- Generalising the splitter to other languages or to tile audio.
- Hand-correcting low-confidence cuts before ship — the tool ships its best guess; review happens in-game.
- Replaying the syllable from the repeat button — repeat stays word-only for v1.

## Unresolved Questions

- ffmpeg `silencedetect` thresholds (noise floor, minimum gap) will need one tuning pass against the real recordings; defaults are `-30dB` / `0.08s`, exposed as CLI flags. Some fraction of the 90 multi-character words — especially the 11 three/four-character ones — will land in the equal-duration fallback path and sound rough until reviewed.
- Whether any of the 12 single-character source recordings themselves have enough leading/trailing silence to need trimming, or can be copied verbatim.
