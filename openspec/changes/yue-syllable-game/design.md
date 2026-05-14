## Context

The `yue` pack uses `Script type: Chinese`. Each word in `aa_wordlist.txt` is written in Chinese characters in the Language-of-Play column; each character is one syllable. The pack ships 102 words: 12 one-character, 79 two-character, 8 three-character, 3 four-character — 151 distinct characters in total. Every word has a recording at `languages/yue/audio/words/<englishLwc>.mp3`.

There is **no Java analog for the splitting tool** — the legacy Android pipeline ships syllable audio hand-cut by the language community. This change automates the first pass of that cutting for the `yue` pack.

The **game** is not new: `feature-game-georgia` is the ported `Georgia.java` (first-sound identification). Its S-mode is fully built — it picks a word, parses it into syllables with a greedy longest-match parser, and asks the player to tap the word's first syllable from a grid of choices. The only behavioural gap for this feature is that S-mode plays the *whole word* and never the isolated syllable; this change closes that gap.

### Required reading for implementers

- `AGENTS.md`, `openspec/AGENT_PROTOCOL.md`
- `docs/ARCHITECTURE.md` §5 (pack shape), §8 (audio), §17 (game taxonomy)
- `docs/CODE_STYLE.md` (no direct `useEffect`; one function per file)
- `docs/GAME_PATTERNS.md` — "Auto-advance after correct (Italy)" timer-ref pattern; "Challenge level decoding" Georgia row
- `../AlphaTiles/app/src/main/java/org/alphatilesapps/alphatiles/Georgia.java` — S-mode reference (`setWord` ~173, `playActiveWordClip` ~161)
- `tools/build-stroke-data-deva.ts` — sibling build-tool convention (CLI shape, cache dir, `tools/data/`)
- `libs/alphaTiles/feature-game-georgia/src/` — `GeorgiaContainer.tsx`, `parseWordIntoSyllables.ts`, `buildSyllableChoicesRandom.ts`, `pickGeorgiaWord.ts`
- `libs/shared/util-lang-pack-parser/src/parseSyllables.ts`, `parseWordlist.ts`
- `libs/shared/util-lang-pack-validator/src/checks/checkAudioReferences.ts`, `checkSyllablesCoherence.ts`
- `tools/generate-lang-manifest.ts` (§ "Audio: syllables")
- `libs/alphaTiles/data-audio/src/lib/useAudio.ts` (`playSyllable`)

## Goals / Non-Goals

**Goals:**
- One reusable build tool that turns `yue` word audio into per-syllable clips with minimal manual work.
- A complete, validator-passing `yue` syllable dataset: 151 clips + 151-row `aa_syllables.txt`.
- A playable syllable-game door reachable from the menu.
- Georgia S-mode plays the isolated syllable so the cut audio is actually heard.
- The Georgia change is additive and gated — T-mode, existing tests, and stories are untouched.

**Non-Goals:**
- Hand-tuned cut quality before ship. The tool ships best guesses; in-game review drives any re-cut.
- Distractor curation in `aa_syllables.txt`.
- Modifying `aa_wordlist.txt`, the manifest generator, parser, validator, or audio system.
- Generalising the tool beyond `yue` or beyond word→syllable cutting.
- Higher Georgia challenge levels, the hard band, or repeat-button syllable playback.

## Decisions

### D1. Tool: `tools/split-syllable-audio.ts`

A standalone Node/TS script, run via `npx tsx tools/split-syllable-audio.ts` (matches the `tools/build-stroke-data-*.ts` invocation convention). It is `yue`-specific by design — paths are hard-coded to `languages/yue/`. It shells out to the system `ffmpeg` / `ffprobe` (confirmed installed, n8.1.x).

Pipeline:
1. Parse `languages/yue/aa_wordlist.txt` via the existing `parseWordlist` from `@shared/util-lang-pack-parser`. For each row: `englishLwc` = `audio/words/` filename stem; `wordInLOP` = the Chinese string; `chars = [...wordInLOP]` (spread handles multi-byte codepoints; all `yue` characters are in the BMP but spread is correct regardless).
2. Build the unique-character set and, for each character, the list of `(word, charIndex)` occurrences.
3. For each unique character, choose **one** source occurrence (see D3) and produce `languages/yue/audio/syllables/<char>.mp3`.
4. Emit `languages/yue/aa_syllables.txt` (see D5).
5. Emit a review report (see D4) to stdout and to `tools/data/yue-syllable-cuts/review-report.json`.

CLI flags: `--noise <dB>` (default `-16`), `--min-gap <seconds>` (default `0.06`), `--dry-run` (report only, write nothing). The defaults were tuned against the actual recordings (see Open Questions) — most clips are connected speech, so an aggressive `-16 dB` amplitude floor is needed to catch the dip between syllables, while a `0.06 s` minimum gap rejects within-syllable blips. No network, no cache of remote assets — unlike the stroke tools, all inputs are local.

### D2. Silence-detection split algorithm

For a word whose Chinese string has `N` characters (`N > 1`):
1. Run `ffmpeg -i <src> -af silencedetect=noise=<noise>:d=<minGap> -f null -` and parse `silence_start` / `silence_end` pairs from stderr.
2. Discard silence intervals in the leading 10% and trailing 10% of the clip (those are edge padding, not inter-syllable gaps).
3. **High-confidence path** — exactly `N-1` interior gaps remain: cut points are the midpoints of each gap. Slice into `N` pieces with `ffmpeg -ss/-to`, then trim leading/trailing silence from each piece with `silenceremove`.
4. **Low-confidence path** — gap count ≠ `N-1` (too many, too few, or zero): fall back to **equal-duration division** — split the total duration into `N` equal slices. Still trim each piece. Flag the word in the review report.

Every produced piece is normalised to mp3 (same codec/bitrate as the source) so the manifest `require()` and the audio preloader treat them identically to existing clips.

### D3. Dedup: one clip per unique character, source-selection priority

151 characters, one mp3 each. For a character `c`, the source is chosen in this priority order:

1. **`c` is itself a one-character word** — copy `audio/words/<thatWord>.mp3` verbatim (optionally silence-trimmed). This is the cleanest possible clip: a real isolated utterance, no cut artefacts. Covers 12 characters.
2. **`c` appears at index 0 of some multi-character word** — cut the first slice from that word. A word-initial syllable has a clean onset and no left-coarticulation bleed. If several words qualify, prefer the shortest word (fewest cut boundaries → most reliable silence detection).
3. **`c` only appears at index > 0** — cut the slice at its position from the shortest such word. These clips have the highest risk of a clipped onset; they are the most likely review-report entries.

The review report records, per character, which tier it came from and (for tiers 2–3) whether the source word took the high- or low-confidence split path.

### D4. Review report

`tools/data/yue-syllable-cuts/review-report.json` — an array of `{ char, sourceWord, sourceEnglishLwc, tier: 1 | 2 | 3, splitPath: 'verbatim' | 'silence' | 'equal-duration', charIndex, pieceDurationMs }`. The tool also prints a stdout summary: counts per tier, and an explicit list of every `equal-duration` entry (those are the "review me first" clips). `tools/data/yue-syllable-cuts/` is git-ignored — it is a diagnostic artefact, not a committed input.

### D5. `aa_syllables.txt` schema

Seven tab-separated columns, parsed by `parseSyllables`: `Syllable, Or1, Or2, Or3, SyllableAudioName, Duration, Color`. The generated file has a header row + 151 data rows. Per row:

- `Syllable` = the raw Chinese character (e.g. `醫`). This is the key the engine indexes syllables by (`resolveAudio` maps `audioName → handle`, then re-keys by `syllable`).
- `Or1 / Or2 / Or3` = empty. ChallengeLevel 1 uses `buildSyllableChoicesRandom`, which fills choice slots from the shuffled syllable pool and never reads distractor columns. `checkSyllablesCoherence` — the only check that validates distractors — stays inactive (see D7), so empty is safe.
- `SyllableAudioName` = the raw Chinese character, same as `Syllable`. The manifest generator emits `audio/syllables/<SyllableAudioName>.mp3`; the file is literally `醫.mp3`. Non-ASCII filenames are fine for `fs`, Metro `require()`, and the manifest's `JSON.stringify`-escaped string keys.
- `Duration` = integer milliseconds of the produced clip, from `ffprobe`. `parseSyllables` requires this to be a valid int.
- `Color` = `index % colorCount` cycling through `aa_colors.txt` indices, so the choice tiles aren't monochrome. Mirrors how other games colour tiles.

### D6. Door row in `aa_games.txt`

Append one tab-separated row after the existing 8 doors:

```
9	Georgia	1	1	X	0	S	-
```

`Door=9`, `Country=Georgia`, `ChallengeLevel=1`, `Color=1` (themeBlue), `InstructionAudio=X` (none — `X` is a recognised no-audio sentinel), `AudioDuration=0`, `SyllOrTile=S`, `StagesIncluded=-`.

`useDoors.ts` already derives `classKey='georgia'`, `syllableGame='S'`, `challengeLevel=1` from this row, and the route `apps/alphaTiles/app/games/georgia.tsx` already forwards those params to `GeorgiaContainer`. No routing or menu code changes.

`countForLevel(1)` returns 6 and `isHardBand(1)` is false, so the door is a 6-choice random-pool syllable round — the intended entry-level shape.

### D7. No change to `aa_wordlist.txt`; validator stays green

`parseWordIntoSyllables` does `wordInLOP.replace(/[#.]/g, '')` then greedy longest-prefix matching against the syllable list. For `yue`, every syllable is exactly one character and every word character is in `aa_syllables.txt`, so the parse is unambiguous and total without any `.` markers. Adding `.` markers would also change the displayed Language-of-Play orthography — undesirable.

Consequence for the validator:
- `checkSyllablesCoherence` only activates when ≥6 words have a `.` in their LOP column. With zero dotted words it stays inactive and emits the informational `SYLLABLES_SKIPPED` — not an error. Distractor and word↔syllable cross-checks are therefore skipped; acceptable for v1.
- `checkAudioReferences` **is** active: `aa_settings.txt` already has `Has syllable audio: TRUE`, so every `aa_syllables.txt` row's `SyllableAudioName` must resolve to a file in `audio/syllables/`, and a zero-byte clip is an error. **All 151 clips must exist and be non-empty before a build passes.** The tool must not emit a partial dataset.
- Orphan check: any `audio/syllables/*.mp3` not referenced by a syllable row is a warning. Since the tool generates both the clips and the index together from the same character set, there are no orphans.

`generate-lang-manifest.ts` already has an `audio/syllables/` block keyed off `parseSyllables(...).rows[].audioName` — it picks the new files up with no tooling change.

### D8. Georgia S-mode audio tweak

The change is confined to the `isSyllable` branch of `startRound` in `GeorgiaGame` (inside `GeorgiaContainer.tsx`). Today that branch ends with `audio.playWord(chosen.word.wordInLWC)` (Java `playActiveWordClip`). After it:

1. Compute the word's clip length via `audio.getWordDuration(chosen.word.wordInLWC)`, falling back to a constant (e.g. `1200` ms) when the duration is unknown.
2. Schedule `audio.playSyllable(correctText)` after that delay with `setTimeout`, where `correctText` is the first-syllable character already computed for the round.
3. Store the timer id in a `useRef`; clear it at the top of `startRound` and in the unmount cleanup of the existing mount `useEffect` — the Italy auto-advance timer-ref pattern from `GAME_PATTERNS.md`.

`audio.playSyllable` and the `handles.syllables` map already exist and are populated by the preloader; no audio-system change. T-mode never enters this branch. The repeat button and the on-correct audio chain (`playCorrect().then(replayWord)`) are unchanged — repeat stays word-only for v1.

Risk control: the tweak adds one ref and one guarded `setTimeout`. Georgia's existing unit tests are pure-logic (`buildSyllableChoicesRandom`, `pickGeorgiaWord`, etc.) and do not exercise `startRound` audio, so they are unaffected; stories render the presenter and are unaffected.

## Open Questions

- ~~`silencedetect` thresholds need an empirical tuning pass.~~ **Resolved during implementation.** A sweep showed the recordings are mostly connected speech with no measurable inter-syllable silence at conservative floors — the original `-30dB / 0.08s` defaults landed only 18 of 139 cuts on a real gap. `-16dB / 0.06s` was the sweep optimum (≈75 silence-cuts, ≈64 equal-duration) and is now the tool default. Most of the 11 three/four-character words still land in the equal-duration fallback and ship as best guesses for in-game review.
- ~~Whether the 12 one-character source recordings need silence trimming.~~ **Resolved:** verbatim sources are silence-trimmed like every other clip — harmless and consistent.
- Long-term: if the language community later supplies hand-cut syllable audio, this generated dataset is fully replaced — the tool is a bootstrap, not a permanent pipeline stage. Not a blocker for this change.
