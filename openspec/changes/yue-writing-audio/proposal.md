## Why

Issue [#27](https://github.com/rek/alphaTilesAgain/issues/27) — the `yue` (Cantonese) language community supplied hand-recorded single-syllable audio for the first 13 characters in the writing-practice game's stroke-count-sorted rotation, because today the game plays the **wrong audio**. After a learner traces `女`, the game plays `zz_daughter.mp3` (the multi-syllable Cantonese phrase for "daughter") rather than just `女`. `feature-game-taiwan/buildTaiwanData.ts:48-56` explicitly labels this as a v1 fallback "character has no per-character audio in the yue pack"; the pack now does ship per-syllable audio (from the archived `yue-syllable-game` change), but Taiwan was never re-wired to use it. Pedagogically, the learner who just wrote a character should hear that character — not a phrase containing it. Curtis also flagged that the existing in-context recordings for characters that only appear inside multi-syllable compounds (e.g. `人` in `建築工人`) may be shortened/cropped clips that don't actually contain the target character at all — so the syllable swap is a correctness fix, not just a polish.

## What Changes

- Replace **13 existing** `languages/yue/audio/syllables/<char>.mp3` files with the customer's hand recordings: `人 士 女 丈 大 上 下 工 小 叉 手 公 夫`. Source: `/home/adam/Downloads/fixed mp3-20260525T152408Z-3-001/fixed mp3/` (12 files for sort-positions 01–10, 12–13) plus `/home/adam/Downloads/011 手.mp3` (Curtis supplied this separately in the issue-#27 reply after we flagged the gap). These overwrite the auto-`silencedetect`-cut clips shipped by `yue-syllable-game`.
- Normalise filename spacing on copy (`03 女 .mp3` → `女.mp3`, `08工 .mp3` → `工.mp3`, `011 手.mp3` → `手.mp3`, `13 夫 .mp3` → `夫.mp3`, etc.) to match the existing `<char>.mp3` convention.
- Modify `feature-game-taiwan` — both audio call sites (round-complete in `TaiwanInner.tsx:97-99` and the repeat button's `onRepeat` in `TaiwanInner.tsx:80-83`) play `audio.playSyllable(currentChar)` first, falling back to `audio.playWord(audioForChar[currentChar])` if the syllable handle is absent. The compound-word `audioForChar` map stays in the precompute as the fallback path — it's still useful for any pack that hasn't supplied syllable audio yet. Curtis confirmed on issue #27 that the repeat button should mirror completion (syllable-first), so the two call sites share one dispatch path.
- Add (or update) unit tests in `feature-game-taiwan` to cover the syllable-first / compound-fallback selection logic.

## Capabilities

### New Capabilities
- `yue-writing-audio`: covers both pieces of this change in a single capability — (a) the 13 replacement syllable mp3s for the `yue` pack, and (b) the Taiwan engine swap to syllable-first audio with compound-word fallback. The engine swap lives here (not as a MODIFIED delta against `game-taiwan`) because `game-taiwan` is itself an in-flight change with no archived spec to delta against. When `game-taiwan` archives, its spec naturally captures the syllable-first behaviour as the final state.

### Modified Capabilities
- None — see note above on why the Taiwan engine swap is folded into the new capability rather than a MODIFIED delta.

## Impact

- **Pack files** (`languages/yue/audio/syllables/`): 13 binary files overwritten in place. No text-file edits, no `aa_*.txt` changes, no new files.
- **Engine code**: 1 lib touched (`libs/alphaTiles/feature-game-taiwan`) — two call-site swaps in `TaiwanInner.tsx` + unit test for the resolver. `buildTaiwanData.ts` and `pickTaiwanCharacters.ts` untouched. No new precompute key.
- **App routes, validator, manifest generator, parser, audio system**: zero changes. `playSyllable` already exists in `data-audio` (`useAudio.ts:96`); syllable handles already in `langManifest.ts` for yue.
- **Storybook**: existing Taiwan stories may need a `playSyllable` mock added if they don't passively no-op on the new code path (TBD during apply).
- **Other language packs**: unaffected. The two engine call sites short-circuit to the existing `playWord` fallback whenever syllable audio is absent — packs that don't ship `audio/syllables/` see no behaviour change.
- **`yue-numerals-game` collision**: none. That change has been archived as `openspec/changes/archive/2026-05-25-yue-numerals-game/` (implementation commits `78f2e53`, `5d57572`, `3ce0057`, `2d82054`, `4638794`) and its assets are live in `languages/yue/`. The 12 new numeral characters ship their own syllable audio, so once `yue-writing-audio` merges they automatically benefit from the syllable-first path — they're already covered by `assets.audio.syllables`.
- **`game-taiwan` spec coordination**: `openspec/changes/game-taiwan/specs/game-taiwan/spec.md` is in-flight (spec not yet archived). Its "Character Audio On Completion" requirement (lines 97-109) specifies tile-audio-with-compound-fallback and references a non-existent surface `assets.tileAudio["醫"]` (the real surface is `assets.audio.tiles`). When `game-taiwan` archives, that requirement needs to be updated to syllable-first-with-compound-fallback AND to reference the real surface. This change includes guidance for that reconciliation in `design.md` § D8.
- **Customer follow-ups**: closed. Curtis confirmed on issue #27 (a) `手` is included — supplied separately as `011 手.mp3` since the original was already single-syllable in the pack; (b) repeat button SHOULD play syllable audio (mirror completion); (c) writing-practice intent confirmed — the original in-context recordings may have been cropped at record time so the embedded character isn't actually present, which makes the syllable swap a correctness fix not a polish.
