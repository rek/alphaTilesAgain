# Tasks

Add 12 Cantonese numeral characters to the `yue` pack (tiles, words, syllables, audio, strokes, images), append two new Georgia syllable doors, regenerate the landing-page guide, and verify validator + manifest are green. No engine code touched.

## 0. Preflight

- [x] 0.1 Re-read `proposal.md`, `design.md`, and `specs/yue-numerals-game/spec.md`.
- [x] 0.2 Re-read `docs/GAME_PATTERNS.md` § "Reusing a game class for a new pack feature" and § "Per-pack audio generation tooling".
- [x] 0.3 Re-read the closest precedent: `openspec/changes/archive/2026-05-14-yue-syllable-game/{proposal,design,tasks}.md`.
- [x] 0.4 Verify the 12 source audio files are still present at `/home/adam/Downloads/Numerals-20260525T151238Z-3-001/Numerals/` (filenames per design § D3).
- [x] 0.5 Note that `004 四.mp3` is intentionally missing — ship without it.
- [x] 0.6 Confirm `node-canvas` is installed (`npm ls canvas`); if not, install as a devDependency. — canvas@3.2.3 present.
- [x] 0.7 Confirm `tools/build-stroke-data.ts` runs cleanly today against the existing `yue` pack. — clean run during task 4.1 (covered 162/163, only `嫲` pre-existing gap).
- [x] 0.8 Capture pre-change baselines: tiles=104 data rows, wordlist=102, syllables=151, games=9; audio.syllables=151, audio.words=111, audio.tiles=176, images.words=110, strokes=150.

## 1. Pack text files — append 12 rows each

- [x] 1.1 Append 12 rows to `languages/yue/aa_gametiles.txt`. Distractor cycle through the other numerals; FirstAppearsInStage=1 in the primary stage column.
- [x] 1.2 Append 12 rows to `languages/yue/aa_wordlist.txt` (`zz_<digit>\t<char>\t0\t-\t0\t-`).
- [x] 1.3 Append 12 rows to `languages/yue/aa_syllables.txt` with real ffprobe-derived `Duration` values and color cycling from index 8.
- [x] 1.4 Verified row counts: tiles 105→117, wordlist 103→115, syllables 152→164 (baseline + 12 in each).

## 2. Audio assets

- [x] 2.1 Copied 12 source mp3s to `languages/yue/audio/syllables/<char>.mp3` (plain `cp`, no re-encoding).
- [x] 2.2 Copied 12 source mp3s to `languages/yue/audio/words/zz_<digit>.mp3`.
- [x] 2.3 Ran `ffprobe` against each new syllable mp3 and back-filled real ms durations into `aa_syllables.txt` (one row per numeral, values 405–940 ms).
- [x] 2.4 Verified file counts: audio/syllables 163, audio/words 123 (was 151 + 12 = 163 and 111 + 12 = 123). No zero-byte files.
- [x] 2.5 **Discovered during validation**: `aa_settings.txt` has `Has tile audio: TRUE`, so the validator's `checkAudioReferences` requires `audio/tiles/<AudioName>.mp3` for every tile row. Copied the same 12 mp3s to `languages/yue/audio/tiles/zz_<digit>.mp3`. The original design § D2 table omitted this; updated spec + design to capture it.

## 3. Reference images — `tools/build-numeral-images.ts`

- [x] 3.1 Created `tools/build-numeral-images.ts` (node-canvas, 512×512 white background, `#1565C0` digits, auto-shrink font for wider labels).
- [x] 3.2 Ran the tool; 12 PNGs written under `languages/yue/images/words/zz_<digit>.png`.
- [x] 3.3 Spot-checked `zz_1.png` and `zz_10000.png` visually — digits centred, legible, no clipping.
- [x] 3.4 File count: images/words 122 (was 110 + 12). No zero-byte files.

## 4. Stroke data

- [x] 4.1 Ran `APP_LANG=yue npx tsx tools/build-stroke-data.ts`. Output: `covered=162, missing=1, total=163`. The 1 missing is `嫲` (pre-existing yue gap; not a numeral).
- [x] 4.2 Verified 12 new files: `languages/yue/strokes/{一,二,三,五,六,七,八,九,十,百,千,萬}.json` all present.
- [x] 4.3 Spot-checked `languages/yue/strokes/一.json` — has `character: "一"`, `strokes`/`medians` arrays.

## 5. Door rows + landing-page guide

- [x] 5.1 Appended two rows to `languages/yue/aa_games.txt`:
  - `10\tGeorgia\t2\t2\tX\t0\tS\t-`
  - `11\tGeorgia\t3\t3\tX\t0\tS\t-`
- [x] 5.2 Ran `npx tsx tools/generate-cantonese-doors.ts`; `apps/home/src/app/cantoneseDoors.generated.ts` now has 11 entries ending in `georgia-2-S` and `georgia-3-S`.
- [x] 5.3 Added `'georgia-2-S'` and `'georgia-3-S'` entries to the `DOOR_CONTENT` map in `apps/home/src/app/cantoneseGuide.tsx`. (Difficulty type is `'Easy' | 'Medium' | 'Hard'` — used Medium for 12-choice, Hard for 18-choice.)

## 6. Validation

- [x] 6.1 `APP_LANG=yue tools/validate-lang-pack.ts` → **0 errors**, 97 warnings (mostly pre-existing TILE_UNDERUSED), 125 infos (incl. expected `SYLLABLES_SKIPPED`).
- [x] 6.2 `APP_LANG=yue tools/generate-lang-manifest.ts` → `audio.tiles: 116`, `audio.words: 114`, `audio.syllables: 163`, `images.words: 114`, `strokes: 162`. Counts match expected.
- [x] 6.3 `npx tsc --noEmit -p apps/home/tsconfig.json` — no errors.
- [x] 6.4 `./nx lint home` — successful, no errors / warnings.
- [x] 6.5 Confirmed no engine library changed: only diff inside `libs/` is `libs/alphaTiles/data-language-assets/src/generated/langManifest.ts` (auto-regenerated, not hand-edited).

## 7. Manual smoke test

**Status at archive: deferred — requires browser + audio (no e2e harness in v1, per `docs/ARCHITECTURE.md` §15).** Static verification done via validator + manifest + typecheck + lint (all green). Customer / next-touching contributor should run these before relying on the doors.

- [ ] 7.1 Build the yue web bundle: `nx start-web-yue alphaTiles` (or `APP_LANG=yue EXPO_BASE_URL=/alphaTilesAgain/yue npx nx run alphaTiles:web-export` for a full export check). Confirm bundle compiles with no errors and route count matches.
- [ ] 7.2 Open `/menu` in a browser. Confirm 11 door tiles render (was 9; the two new ones are Doors 10 + 11 with the new colours).
- [ ] 7.3 Tap Door 10 (Georgia CL2 S). Confirm: a Cantonese word plays, then its first syllable plays in isolation, then 12 syllable choices render in a grid. Tap the correct one — confirm the correct-answer fanfare fires and the score increments.
- [ ] 7.4 Tap Door 11 (Georgia CL3 S). Confirm 18 choices render and the same audio + correctness flow works.
- [ ] 7.5 Tap any existing Taiwan door (6, 7, or 8). Confirm the first character offered for writing is `一` (1 stroke), then subsequent characters follow ascending stroke count.
- [ ] 7.6 Play one complete round on each new door (12 trackers filled). Confirm celebration fires.
- [ ] 7.7 Verify audio for at least 4 of the 12 numerals by ear (1, 5, 10, 萬) — each should sound right and be free of clipping.
- [ ] 7.8 Smoke test the landing page (`apps/home`): the Cantonese guide page shows 11 doors, the two new ones have proper descriptions and no "missing description" fallback text.

## 8. Customer follow-up

- [x] 8.1 Drafted at `/tmp/issue-28-comment.md` covering the four customer-input items (missing `四` audio, `10 thousand.mp3` mystery, composites deferred to follow-up, `萬` reading confirmation).
- [x] 8.2 Posted ahead of the merge: https://github.com/rek/alphaTilesAgain/issues/28#issuecomment-4535449886 (user instructed to post during apply so the customer can start working on the missing items in parallel; will be re-linked from the PR description per task 9.3).

## 9. Commit + PR

- [x] 9.1 Staged + committed in the planned 5-way split, plus one follow-up `style(yue): normalize aa_gametiles.txt line endings to CRLF`. Pushed to origin/main (6 commits: 78f2e53, 5d57572, 3ce0057, 2d82054, 4638794, 67e6138).
- [~] 9.2 / 9.3 **N/A** — user chose direct-to-main over PR-based merge. No PR opened. Customer follow-up items (8.1) live in the issue-#28 comment thread instead of a PR description.
