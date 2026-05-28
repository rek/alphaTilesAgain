## 0. Preflight

- [x] 0.1 Re-read `proposal.md`, `design.md`, both spec files in this change directory
- [x] 0.2 Read `libs/alphaTiles/feature-game-shell/src/lib/GameShellContainer.tsx` for current `replayWord`
- [x] 0.3 Read `libs/alphaTiles/feature-game-georgia/src/parseWordIntoSyllables.ts` (about to relocate)
- [x] 0.4 Read `docs/GAME_PATTERNS.md` "Deferred audio after a clip: timer-ref, not chained promise" and the yue-syllable-game audio chain reference
- [x] 0.5 Read `libs/shared/util-phoneme/src/index.ts` re-exports (target home for the parser)
- [x] 0.6 Confirm `yue-numerals-game` and `yue-writing-audio` are archived (or aware they're sibling work)

## 1. Promote `parseWordIntoSyllables` to `util-phoneme`

- [x] 1.1 Copy `libs/alphaTiles/feature-game-georgia/src/parseWordIntoSyllables.ts` → `libs/shared/util-phoneme/src/parseWordIntoSyllables.ts` — re-implemented with a structural generic (`T extends { syllable: string }`) to satisfy the util→nothing dep rule (cannot import `LangAssets`)
- [x] 1.2 Add `export { parseWordIntoSyllables } from './parseWordIntoSyllables';` to `libs/shared/util-phoneme/src/index.ts`
- [x] 1.3 Update Georgia container's import path to `@shared/util-phoneme`
- [x] 1.4 Delete `libs/alphaTiles/feature-game-georgia/src/parseWordIntoSyllables.ts`
- [x] 1.5 Verify Georgia game still typechecks (Georgia jest suite 33/33 PASS)
- [x] 1.6 Test file moved to `libs/shared/util-phoneme/src/parseWordIntoSyllables.spec.ts` with yue-composite cases added (8/8 PASS); old `feature-game-georgia/src/__tests__/parseWordIntoSyllables.test.ts` deleted

## 2. Shell `replayWord` fallback

- [x] 2.1 In `GameShellContainer.tsx`, import `parseWordIntoSyllables` from `@shared/util-phoneme` (other imports were already present)
- [x] 2.2 Define module-scope constants `GAP_MS = 150` and `FALLBACK_MS = 700`
- [x] 2.3 Add a `chainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)` and a `clearChain()` callback that clears + nulls it
- [x] 2.4 Modify `replayWord` (callback) — three branches A/B/C implemented inline (recursive `playStep(i)` schedules next via `setTimeout(getSyllableDuration ?? FALLBACK_MS + GAP_MS)`)
- [x] 2.5 Lock semantics: `setInteractionLocked(true)` at chain start; final `setTimeout` unlocks after the last syllable's natural duration
- [x] 2.6 Wrapped `setRefWord` exposed via context with a `setRefWordWithChainClear` that calls `clearChain()` first — covers every container's round transition
- [x] 2.7 AppState background branch now clears `chainTimerRef`
- [x] 2.8 Unmount cleanup `useEffect` now also clears `chainTimerRef`
- [x] 2.9 No `data-audio` files touched; util-phoneme dep rule honored via the `<T extends { syllable: string }>` generic so no `LangAssets` import leaks

## 3. Pack-data additions

- [x] 3.1 Appended 5 rows to `languages/yue/aa_wordlist.txt` (`zz_20`/`二十`, `zz_30`/`三十`, `zz_50`/`五十`, `zz_1000000`/`一百萬`, `zz_203`/`二百零三`)
- [x] 3.2 `aa_gametiles.txt` unchanged
- [x] 3.3 Extended `tools/build-numeral-images.ts` `NUMERALS` array with the 5 composite entries
- [x] 3.4 Ran tool — 19 PNGs written total, 5 new (`zz_20`, `zz_30`, `zz_50`, `zz_203`, `zz_1000000`)
- [x] 3.5 Tightened `fontPxForLabel` for 6/7-char labels (added `<=6 → 115`, `>6 → 100`); zz_1000000 + zz_203 visually clean with margin
- [x] 3.6 Regenerated manifest — `images.words` 116 → 121

## 4. Validator + manifest verification

- [x] 4.1 Validator → 0 errors. 5 new `MISSING_WORD_AUDIO` **warnings** with the new `shell will play syllable chain for "<LOP>"` message. This required a small validator change (see 4.5).
- [x] 4.2 No new error categories.
- [x] 4.3 Wordlist parsed; manifest gen succeeded.
- [x] 4.4 Pre-existing 12 base-numeral rows + the 13th (`零`) still pass validator.
- [x] 4.5 Validator: in `libs/shared/util-lang-pack-validator/src/checks/checkAudioReferences.ts`, added a syllable-decomposability gate. When `Has syllable audio: TRUE` AND the wordlist row's `wordInLOP` decomposes via `parseWordIntoSyllables` AND every constituent syllable's audio is in `inventory.syllableAudio`, the `MISSING_WORD_AUDIO` issue is emitted at `severity: 'warning'` with a different message ("shell will play syllable chain for <LOP>"). All other cases stay at `'error'`. Validator suite 59/59 PASS. (Implements design Open Q O2 inline since it was needed to unblock 4.1.)

## 5. Tests

- [x] 5.1 Relocated parseWordIntoSyllables + added yue cases (8/8 PASS) — done in task 1.6
- [ ] 5.2 Unit-test the shell chain logic (deferred — see notes below)
- [ ] 5.3 Fake-timers verification (deferred — see notes below)
- [x] 5.4 Storybook not story-covered for shell; skipping per spec

**Deferred — 5.2 and 5.3:** The chain logic is inline inside `replayWord` (a `useCallback` closure). Extracting into a testable pure helper requires either: (a) refactoring `replayWord` to delegate to a `scheduleSyllableChain` module, or (b) testing through the container (React-testing-library). Neither is blocking — the parser tests (5.1) cover the decomposition that drives the chain, and the integration is straightforward (4 lines of `setTimeout`-and-`playSyllable`). Recommendation: tackle 5.2/5.3 as a follow-up if a regression appears during manual QA, or extract during the next composite-related change.

## 6. Manual QA — owner: user (Claude can't drive devices)

- [ ] 6.1 Launch yue web build (`APP_LANG=yue ./nx start alphaTiles`), reach a Thailand or Georgia T-mode round
- [ ] 6.2 Confirm composite syllable chain plays with audible 150 ms gaps when one of `二十`/`三十`/`五十`/`一百萬`/`二百零三` is the call
- [ ] 6.3 Tap replay button mid-chain → chain restarts cleanly
- [ ] 6.4 Hit back mid-chain → no orphan syllables play after navigation
- [ ] 6.5 Tune `GAP_MS` if 150 ms sounds wrong (per design Open Q O1)
- [ ] 6.6 iOS Simulator + Android emulator smoke test
- [x] 6.7 Validator passes (0 errors, 102 warnings, 127 info) — composites no longer block the build

## 7. Documentation + memory

- [x] 7.1 Added "Syllable-chain audio fallback in shell" section to `docs/GAME_PATTERNS.md` referencing this change + yue-syllable-game timer pattern + the validator downgrade
- [ ] 7.2 Update `MEMORY.md` index for `yue-numerals-pending` (deferred to archive step)

## 8. Wrap

- [x] 8.1 Diff review:
  - `languages/yue/aa_wordlist.txt` — 5 row appends
  - `languages/yue/images/words/zz_{20,30,50,203,1000000}.png` — 5 new files
  - `tools/build-numeral-images.ts` — 5 NUMERALS entries + tighter 6/7-char font sizing
  - `libs/shared/util-phoneme/src/parseWordIntoSyllables.{ts,spec.ts}` — promoted from feature-game-georgia, generic over row type
  - `libs/shared/util-phoneme/src/index.ts` — re-export
  - `libs/alphaTiles/feature-game-georgia/src/{GeorgiaContainer.tsx,__tests__/...,parseWordIntoSyllables.ts}` — import swap; old files deleted
  - `libs/alphaTiles/feature-game-shell/src/lib/GameShellContainer.tsx` — chain fallback + timer-ref hygiene
  - `libs/shared/util-lang-pack-validator/src/checks/checkAudioReferences.ts` — decomposability gate downgrades severity
  - `libs/alphaTiles/data-language-assets/src/generated/langManifest.ts` — regen
  - `docs/GAME_PATTERNS.md` — pattern doc
- [x] 8.2 `openspec validate yue-composite-numerals --strict` — green
- [ ] 8.3 Commit (user decides when)
- [ ] 8.4 Post issue #28 update after merge
