# Tasks

Cut `yue` word audio into per-syllable clips, ship the syllable dataset, wire a Georgia S-mode door, and make Georgia S-mode play the isolated syllable.

## 0. Preflight

- [x] Read `proposal.md` and `design.md`.
- [x] Read `openspec/specs/georgia/spec.md` and this change's `specs/georgia/spec.md` delta.
- [x] Read `../AlphaTiles/.../Georgia.java` S-mode (`setWord` ~173, `playActiveWordClip` ~161).
- [x] Read `libs/alphaTiles/feature-game-georgia/src/GeorgiaContainer.tsx` — locate the `isSyllable` branch of `startRound` and the mount `useEffect`.
- [x] Read `tools/build-stroke-data-deva.ts` for the build-tool CLI / `tools/data/` convention.
- [x] Read `libs/shared/util-lang-pack-parser/src/parseWordlist.ts` and `parseSyllables.ts`.
- [x] Confirm `ffmpeg` and `ffprobe` are on `PATH` (`ffmpeg -version`).
- [x] Confirm `languages/yue/audio/words/` has a clip for every `aa_wordlist.txt` row.

## 1. Splitting tool — `tools/split-syllable-audio.ts`

- [x] Scaffold `tools/split-syllable-audio.ts` with CLI flags `--noise` (default `-30`), `--min-gap` (default `0.08`), `--dry-run`.
- [x] Parse `languages/yue/aa_wordlist.txt` via `parseWordlist`; build `chars = [...wordInLOP]` per row and the unique-character → `(word, charIndex)[]` occurrence map.
- [x] Implement `silencedetect` invocation + stderr parsing into interior silence gaps (discard leading/trailing 10%).
- [x] Implement the high-confidence split: `N-1` gaps → cut at gap midpoints, `silenceremove`-trim each piece.
- [x] Implement the equal-duration fallback for low-confidence words; tag them for the review report.
- [x] Implement source selection (D3): tier 1 verbatim one-char-word copy, tier 2 first-position cut (shortest word), tier 3 later-position cut (shortest word).
- [x] Write `languages/yue/audio/syllables/<char>.mp3` for all 151 characters (skip writes under `--dry-run`).
- [x] Generate `languages/yue/aa_syllables.txt`: header + 151 rows (`Syllable`=`SyllableAudioName`=char, `Or1-3` empty, `Duration` from `ffprobe` ms, `Color` cycling `aa_colors.txt` indices).
- [x] Emit `tools/data/yue-syllable-cuts/review-report.json` + stdout summary (per-tier counts, explicit equal-duration list).
- [x] Add `tools/data/yue-syllable-cuts/` to `.gitignore`.

## 2. Generate `yue` syllable assets

- [x] Run `npx tsx tools/split-syllable-audio.ts` (no flags) against the real recordings.
- [x] Inspect the stdout summary; if the equal-duration count is unreasonable, do one tuning pass on `--noise` / `--min-gap` and re-run.
- [x] Verify `languages/yue/audio/syllables/` has 151 non-empty mp3s and `languages/yue/aa_syllables.txt` has 151 data rows.
- [x] Spot-check a handful of clips by ear (one tier-1, one clean tier-2, one equal-duration entry).

## 3. `yue` pack door wiring

- [x] Append Door 9 to `languages/yue/aa_games.txt`: `9 \t Georgia \t 1 \t 1 \t X \t 0 \t S \t -` (tab-separated).
- [x] Confirm `apps/alphaTiles/app/games/georgia.tsx` already exists — no route file change needed.

## 4. Georgia S-mode audio tweak

- [x] In `GeorgiaContainer.tsx`, add a `syllableTimerRef` (`useRef<ReturnType<typeof setTimeout> | null>`).
- [x] In `startRound`, clear `syllableTimerRef` at the top (before any branch).
- [x] In the `isSyllable` branch, after `audio.playWord(...)`, schedule `audio.playSyllable(correctText)` via `setTimeout` using `audio.getWordDuration(...)` (constant fallback, e.g. `1200` ms); store the id in `syllableTimerRef`.
- [x] Clear `syllableTimerRef` in the unmount cleanup of the existing mount `useEffect`.
- [x] Confirm the T-mode branch is untouched and `playSyllable` is never reached in T-mode.

## 5. Verification

- [x] Run the lang-pack validator for `yue`; confirm `SYLLABLES_SKIPPED` info is present and there are **no** error-severity syllable issues (`MISSING_SYLLABLE_AUDIO`, `ZERO_BYTE_AUDIO_FILE`, `ORPHAN_AUDIO_FILE`). — 0 errors, `SYLLABLES_SKIPPED` present.
- [x] Run `APP_LANG=yue` manifest generation; confirm `audio.syllables` has 151 entries. — `audio.syllables: 151`.
- [x] Type-check: `npx tsc --noEmit -p libs/alphaTiles/feature-game-georgia/tsconfig.lib.json`. — no errors.
- [x] Lint: `./nx lint feature-game-georgia`. — passed (`--max-warnings 0`).
- [x] Test: `./nx test feature-game-georgia` — existing Georgia pure-logic tests still pass. — 8 suites / 36 tests passed.
- [x] Smoke test — automated portion: `APP_LANG=yue` web bundle compiles (2362 modules, no errors); pack loads with the new 151-row `aa_syllables.txt` + `audio/syllables/`; `/menu` → 200 and `/games/georgia?gameNumber=9&challengeLevel=1&syllableGame=S` → 200 with rendered HTML.
- [ ] Smoke test — **needs a human with a browser + audio**: confirm Door 9 appears in the menu grid; a round plays the word then the isolated first syllable; 6 choices render; correct/incorrect taps behave; rapid round-advance fires no stale syllable audio. (No e2e harness in v1 — ARCHITECTURE.md §15.)
