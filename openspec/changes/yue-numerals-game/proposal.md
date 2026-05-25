## Why

Issue [#28](https://github.com/rek/alphaTilesAgain/issues/28) — the `yue` (Cantonese) language community supplied audio for the base Chinese numerals and asked for a writing game over them plus, later, drills on composite numerals (`二十`, `二百三`…). The numerals are pedagogically distinct from the existing 80-word `yue` tile catalogue — beginners need to learn them in isolation — but none of the numeral characters are in the current pack, so today no `yue` door can drill them. The engine already has a writing game (Taiwan, HanziWriter stroke-tracing) and an isolated-syllable listening game (Georgia S-mode) wired for `yue`; this change adds the pack data so both games start including the numerals automatically, plus adds menu doors so the customer sees a new "batch" of games as requested.

## What Changes

- Add the **12 base numeral characters** (`一二三 五六七八九 十百千萬` — missing `四` until the customer supplies audio) to the `yue` pack:
  - 12 rows appended to `aa_gametiles.txt` (one tile row per character, `Type=X`, `AudioName=zz_<digit>`).
  - 12 rows appended to `aa_wordlist.txt` so each numeral is also a one-character word (the existing `yue` pack uses this same dual-listing pattern for one-char words like `仔`, `女`). Required so the listening game (Georgia S-mode, which picks from words) can drill them.
  - 12 rows appended to `aa_syllables.txt` keyed by raw character.
  - 12 mp3s copied + renamed into `audio/syllables/<char>.mp3` from `/home/adam/Downloads/Numerals-…/Numerals/`.
  - 12 mp3s copied + renamed into `audio/words/zz_<digit>.mp3` (same source clips — for `yue`, single-char-word audio == single-syllable audio, mirroring the yue-syllable-game tier-1 source pattern).
  - 12 stroke-data JSON files generated into `languages/yue/strokes/<char>.json` via the existing Taiwan stroke-data pipeline.
  - 12 reference image placeholders generated into `images/words/zz_<digit>.png` rendering the Arabic digit (`1`, `2`, … `10000`) on a plain background, satisfying the validator's `checkImageReferences` requirement that every word LWC has an image and giving Georgia's reference-image slot something meaningful to display for the numeral words.
- Append **2 door rows** to `aa_games.txt` so the customer sees a "new batch" in the menu — both reuse existing classes; no engine code change:
  - Door 10: `Georgia` CL2 S — 12-choice listen-and-tap covering the full syllable pool (now including the 12 numerals).
  - Door 11: `Georgia` CL3 S — 18-choice listen-and-tap, hardest band.
- No new Taiwan doors. Taiwan auto-sorts its character pool by stroke count ascending (see `buildTaiwanData.ts:43-46`), so adding 1-stroke `一` / 2-stroke `二 七 八 九 十` / 3-stroke `三 千 萬` / 5-stroke `五` etc. **automatically lands the numerals at the front of the existing Taiwan doors 6/7/8 rotation** — the customer's "writing game over numerals" is satisfied without a new door, and learners actually progress simple→complex through numerals first.

## Capabilities

### New Capabilities
- `yue-numerals-game`: the 12-numeral pack-data additions to `yue` (tiles, words, syllables, audio, strokes, images), the one-off image-generation tool, and the two new Georgia door rows.

### Modified Capabilities
None. Both `game-taiwan` and `georgia` already cover the player-visible behaviour the new doors and the auto-included numeral characters exercise — no requirement-level changes.

## Impact

- **Pack files** (`languages/yue/`): 6 text files appended-to, ~48 binary files added (12 audio × 2 dirs, 12 stroke JSON, 12 placeholder PNGs).
- **Engine code**: zero changes. No `feature-game-*` lib touched, no `data-*` lib touched, no parser / validator / manifest-generator change.
- **App routes**: zero changes. `apps/alphaTiles/app/games/taiwan.tsx` and `.../georgia.tsx` already exist.
- **Tooling**: one new throwaway script `tools/build-numeral-images.ts` to render the Arabic-digit PNGs (analog of `tools/build-stroke-data-deva.ts` — per-pack asset-generation, `yue`-specific, output is committed, the tool itself does not ship at runtime).
- **Other language packs**: unaffected; all changes are inside `languages/yue/` plus the one `yue`-specific tool.
- **Validator surface**: `Has syllable audio: TRUE` is already set, so the 12 new syllable rows must each resolve to a non-zero-byte file before merge; same for the 12 new word-audio rows and the 12 new word-image PNGs (per `checkImageReferences`).
- **Existing Taiwan + Georgia doors** (6/7/8 Taiwan, 9 Georgia S CL1): these will start including the 12 numerals in their pool. For Taiwan this means the rotation starts with `一 二 七 八 九 十 三 千 萬 五 六 百` (sorted by stroke count) before reaching the existing characters — pedagogically aligned with the customer's goal. For Georgia CL1 S the 6-choice pool gets 12 more candidates; correct/incorrect rates are unaffected.
- **Customer follow-ups needed** (to be raised on issue #28 by a comment after this PR):
  - Audio recording for `四` so the 1–10 sequence is complete (this change ships with a gap at 4).
  - Clarification on what `10 thousand.mp3` (183 KB, doesn't match the numbered-character convention) actually contains — likely a composite recording.
  - Audio + agreed transcription convention for composite numerals (`二十`, `二百三` vs `二百三十` vs `二百零三`) so the deferred follow-up change can ship.
- **Known limitation surfaced for future work**: neither `game-taiwan` nor `georgia` currently respects the `StagesIncluded` column on `aa_games.txt`, so a numerals-*only* door (filtering out the existing 80-word vocabulary) is not possible without a small engine extension. Deferred — the simple→complex stroke ordering in Taiwan and the harmless pool-growth in Georgia make this acceptable for v1. A follow-up `stages-filter` change can add the filter to both games when prioritised.
