## Why

Issue [#27](https://github.com/rek/alphaTilesAgain/issues/27) — the `yue` (Cantonese) language community supplied hand-recorded single-syllable audio for the first 12 characters in the writing-practice game's stroke-count-sorted rotation, because today the game plays the **wrong audio**. After a learner traces `女`, the game plays `zz_daughter.mp3` (the multi-syllable Cantonese phrase for "daughter") rather than just `女`. `feature-game-taiwan/buildTaiwanData.ts:48-56` explicitly labels this as a v1 fallback "character has no per-character audio in the yue pack"; the pack now does ship per-syllable audio (from the archived `yue-syllable-game` change), but Taiwan was never re-wired to use it. Pedagogically, the learner who just wrote a character should hear that character — not a phrase containing it.

## What Changes

- Replace **12 existing** `languages/yue/audio/syllables/<char>.mp3` files with the customer's hand recordings: `人 士 女 丈 大 上 下 工 小 叉 公 夫`. Source: `/home/adam/Downloads/fixed mp3-20260525T152408Z-3-001/fixed mp3/`. These overwrite the auto-`silencedetect`-cut clips shipped by `yue-syllable-game`. (Position 11 = `手` not in the customer's bundle — kept on its existing auto-cut clip pending the customer reply on issue #27.)
- Normalise filename spacing on copy (`03 女 .mp3` → `女.mp3`, `08工 .mp3` → `工.mp3`, `13 夫 .mp3` → `夫.mp3`, etc.) to match the existing `<char>.mp3` convention.
- Modify `feature-game-taiwan` — both audio call sites (round-complete in `TaiwanInner.tsx:97-99` and the repeat button's `onRepeat` in `TaiwanInner.tsx:80-83`) play `audio.playSyllable(currentChar)` first, falling back to `audio.playWord(audioForChar[currentChar])` if the syllable handle is absent. The compound-word `audioForChar` map stays in the precompute as the fallback path — it's still useful for any pack that hasn't supplied syllable audio yet.
- Add (or update) unit tests in `feature-game-taiwan` to cover the syllable-first / compound-fallback selection logic.

## Capabilities

### New Capabilities
- `yue-writing-audio`: covers both pieces of this change in a single capability — (a) the 12 replacement syllable mp3s for the `yue` pack, and (b) the Taiwan engine swap to syllable-first audio with compound-word fallback. The engine swap lives here (not as a MODIFIED delta against `game-taiwan`) because `game-taiwan` is itself an in-flight change with no archived spec to delta against. When `game-taiwan` archives, its spec naturally captures the syllable-first behaviour as the final state.

### Modified Capabilities
- None — see note above on why the Taiwan engine swap is folded into the new capability rather than a MODIFIED delta.

## Impact

- **Pack files** (`languages/yue/audio/syllables/`): 12 binary files overwritten in place. No text-file edits, no `aa_*.txt` changes, no new files.
- **Engine code**: 1 lib touched (`libs/alphaTiles/feature-game-taiwan`) — two call-site swaps in `TaiwanInner.tsx` + unit test for the resolver. `buildTaiwanData.ts` and `pickTaiwanCharacters.ts` untouched. No new precompute key.
- **App routes, validator, manifest generator, parser, audio system**: zero changes. `playSyllable` already exists in `data-audio` (`useAudio.ts:96`); syllable handles already in `langManifest.ts` for yue.
- **Storybook**: existing Taiwan stories may need a `playSyllable` mock added if they don't passively no-op on the new code path (TBD during apply).
- **Other language packs**: unaffected. The two engine call sites short-circuit to the existing `playWord` fallback whenever syllable audio is absent — packs that don't ship `audio/syllables/` see no behaviour change.
- **`yue-numerals-game` collision**: none. That change has already landed locally (5 commits ahead of `origin/main`: `78f2e53`, `5d57572`, `3ce0057`, `2d82054`, `4638794`) and ships its own syllable audio for the 12 new numeral characters. Once `yue-writing-audio` merges, those numerals automatically benefit from the syllable-first path — they're already covered by `assets.audio.syllables`.
- **`game-taiwan` spec coordination**: `openspec/changes/game-taiwan/specs/game-taiwan/spec.md` is in-flight (spec not yet archived). Its "Character Audio On Completion" requirement (lines 97-109) specifies tile-audio-with-compound-fallback and references a non-existent surface `assets.tileAudio["醫"]` (the real surface is `assets.audio.tiles`). When `game-taiwan` archives, that requirement needs to be updated to syllable-first-with-compound-fallback AND to reference the real surface. This change includes guidance for that reconciliation in `design.md` § D8.
- **Customer follow-ups** (to raise on issue #27 after Curtis replies):
  - Whether character `手` (sort-position 11) was intentionally omitted or should also be re-recorded.
  - Whether the repeat button should also switch to syllable audio or keep the compound word for "word in context" pedagogy (asked in the comment posted on the issue).
